import type { Client } from '@thebcms/client/main';
import type {
    ControllerItemResponse,
    ControllerItemsResponse,
    Media,
    MediaCreateDirBody,
    MediaDeleteBody,
    MediaRequestUploadTokenResult,
    MediaUpdateBody,
} from '@thebcms/types';
import { MemCache } from '@thebcms/utils/mem-cache';
import type { AxiosProgressEvent } from 'axios';

export interface MediaExtended extends Media {
    svg?: string;
    bin(options?: {
        webp?: boolean;
        sizeTransform?: string;
    }): Promise<ArrayBuffer>;
    thumbnail(): Promise<ArrayBuffer>;
}

/**
 * Utility class for working with BCMS Media.
 */
export class MediaHandler {
    private cache = new MemCache<MediaExtended>('_id');
    private latch: {
        [name: string]: boolean;
    } = {};

    baseUri = `/api/v3/org/:orgId/instance/:instanceId/media`;

    constructor(private client: Client) {
        if (this.client.enableSocket) {
            this.client.socket.register('media', async (data) => {
                if (data.type === 'update') {
                    const cacheHit = this.cache.findById(data.mediaId);
                    if (cacheHit) {
                        await this.getById(data.mediaId, true);
                    }
                } else {
                    this.cache.remove(data.mediaId);
                }
            });
        }
    }

    /**
     * Resolve path to media (ex. /dir1/dir2/file.txt)
     */
    resolvePath(
        /**
         * Media for which to resolve path
         */
        media: Media,
        /**
         * All Media objects. Can be obtained by calling `getAll(...)`
         */
        allMedia: Media[],
    ): string {
        if (media.parentId) {
            const parent = allMedia.find((e) => e._id === media.parentId);
            if (parent) {
                return `${this.resolvePath(parent, allMedia)}/${media.name}`;
            }
        }
        return '/' + media.name;
    }

    /**
     * Get all Media items.
     */
    async getAll(
        /**
         * If set to `true` cache check will be skipped
         */
        skipCache?: boolean,
    ): Promise<MediaExtended[]> {
        if (!skipCache && this.client.useMemCache && this.latch.all) {
            return this.cache.items;
        }
        const res = await this.client.send<ControllerItemsResponse<Media>>({
            url: `${this.baseUri}/all`,
        });
        const items: MediaExtended[] = [];
        for (let i = 0; i < res.items.length; i++) {
            const media = res.items[i];
            const item: MediaExtended = this.toMediaExtended(media);
            if (media.type === 'SVG' && this.client.injectSvg) {
                const svgBuffer = await this.getMediaBin(media._id, media.name);
                item.svg = new TextDecoder().decode(svgBuffer);
            }
            items.push(item);
        }
        if (this.client.useMemCache) {
            this.cache.set(items);
            this.latch.all = true;
        }
        return items;
    }

    /**
     * Get Media by ID
     */
    async getById(
        /**
         * Media ID
         */
        id: string,
        /**
         * If set to `true` cache check will be skipped
         */
        skipCache?: boolean,
    ): Promise<MediaExtended> {
        if (!skipCache && this.client.useMemCache) {
            const cacheHit = this.cache.findById(id);
            if (cacheHit) {
                return cacheHit;
            }
        }
        const res = await this.client.send<ControllerItemResponse<Media>>({
            url: `${this.baseUri}/${id}`,
        });
        const media = res.item;
        const item = this.toMediaExtended(media);
        if (media.type === 'SVG' && this.client.injectSvg) {
            const svgBuffer = await this.getMediaBin(media._id, media.name);
            item.svg = new TextDecoder().decode(svgBuffer).toString();
        }
        if (this.client.useMemCache) {
            this.cache.set(item);
        }
        return item;
    }

    /**
     * Request upload token. This token can be used for upload Media
     * to BCMS.
     *
     * You can call this endpoint only if API Key has a
     * permission to mutate Media.
     *
     * Upload token is valid for only 1 use and valid for 15 minutes.
     */
    async requestUploadToken() {
        const result = await this.client.send<MediaRequestUploadTokenResult>({
            url: `${this.baseUri}/request/upload-token`,
        });
        return result.token;
    }

    /**
     * Create directory
     *
     * You can call this endpoint only if API Key has a
     * permission to mutate Media.
     *
     * Upload token is valid for only 1 use and valid for 15 minutes.
     */
    async createDir(data: MediaCreateDirBody) {
        const result = await this.client.send<ControllerItemResponse<Media>>({
            url: `${this.baseUri}/create/dir`,
            method: 'POST',
            data: data,
        });
        const media = result.item;
        const item = this.toMediaExtended(media);
        if (media.type === 'SVG' && this.client.injectSvg) {
            const svgBuffer = await this.getMediaBin(media._id, media.name);
            item.svg = new TextDecoder().decode(svgBuffer).toString();
        }
        if (this.client.useMemCache) {
            this.cache.set(item);
        }
        return item;
    }

    /**
     * Create a Media file. This endpoint requires an upload token
     * which can be obtained by calling `requestUploadToken()`.
     *
     * You can call this endpoint only if API Key has a
     * permission to mutate Media.
     */
    async createFile(data: {
        parentId?: string;
        uploadToken: string;
        file: File;
        name: string;
        onUploadProgress?: (event: AxiosProgressEvent) => void;
    }) {
        const boundary =
            '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
        const body = await new Promise<Uint8Array>((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = reject;
            reader.onload = () => {
                const uint8Array = new Uint8Array(reader.result as ArrayBuffer);
                const parts = [
                    `--${boundary}\r\n`,
                    `Content-Disposition: form-data; name="file"; filename="${data.name}"\r\n`,
                    `Content-Type: ${data.file.type}\r\n\r\n`,
                    uint8Array,
                    '\r\n',
                    `--${boundary}--\r\n`,
                ];
                const length = parts.reduce((sum, part) => {
                    return (
                        sum +
                        (part instanceof Uint8Array ? part.length : part.length)
                    );
                }, 0);
                const buffer = new Uint8Array(length);
                let offset = 0;
                parts.forEach((part) => {
                    if (part instanceof Uint8Array) {
                        buffer.set(part, offset);
                        offset += part.length;
                    } else {
                        buffer.set(new TextEncoder().encode(part), offset);
                        offset += part.length;
                    }
                });
                resolve(buffer);
            };
            reader.readAsArrayBuffer(data.file);
        });
        // const fd = new FormData();
        // fd.append('file', data.file, data.name);
        const query = [`token=${data.uploadToken}`];
        if (data.parentId) {
            query.push(`parentId=${data.parentId}`);
        }
        const result = await this.client.send<ControllerItemResponse<Media>>({
            url: `${this.baseUri}/create/file?${query.join('&')}`,
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
            },
            data: body,
            onUploadProgress: data.onUploadProgress,
        });
        const media = result.item;
        const item = this.toMediaExtended(media);
        if (media.type === 'SVG' && this.client.injectSvg) {
            const svgBuffer = await this.getMediaBin(media._id, media.name);
            item.svg = new TextDecoder().decode(svgBuffer).toString();
        }
        if (this.client.useMemCache) {
            this.cache.set(item);
        }
        return item;
    }

    /**
     * Update existing Media file
     *
     * You can call this endpoint only if API Key has
     * permission to mutate Media.
     */
    async update(data: MediaUpdateBody) {
        const result = await this.client.send<ControllerItemResponse<Media>>({
            url: `${this.baseUri}/update`,
            method: 'PUT',
            data: data,
        });
        const media = result.item;
        const item = this.toMediaExtended(media);
        if (media.type === 'SVG' && this.client.injectSvg) {
            const svgBuffer = await this.getMediaBin(media._id, media.name);
            item.svg = new TextDecoder().decode(svgBuffer).toString();
        }
        if (this.client.useMemCache) {
            this.cache.set(item);
        }
        return item;
    }

    /**
     * Delete Media files
     *
     * You can call this endpoint only if API Key has
     * permission to mutate Media.
     */
    async deleteById(data: MediaDeleteBody) {
        await this.client.send({
            url: `${this.baseUri}/delete`,
            method: 'DELETE',
            data: data,
        });
        if (this.client.useMemCache) {
            this.cache.remove(data.mediaIds);
        }
    }

    /**
     * Get binary data for specified media
     */
    async getMediaBin(
        /**
         * Media ID
         */
        id: string,
        /**
         * Name of the file. You can use any name or `media.name`.
         */
        filename: string,
        options?: {
            /**
             * Get thumbnail binary data if available
             */
            thumbnail?: boolean;
            /**
             * Get WEBP binary data if available
             */
            webp?: boolean;
            /**
             * Use specified size transform. It must be one of values
             * form `media.sizeTransforms`
             */
            sizeTransform?: string;
        },
    ): Promise<ArrayBuffer> {
        const queries: string[] = [];
        if (options) {
            if (options.webp) {
                queries.push('webp=t');
            }
            if (options.sizeTransform) {
                queries.push(`sizeT=${options.sizeTransform}`);
            }
            if (options.thumbnail) {
                queries.push(`tmb=t`);
            }
        }
        let origin: string;
        if (this.client.cmsOrigin.startsWith('https://app.thebcms.com')) {
            origin = `https://cdn.thebcms.com`;
        } else {
            origin = this.client.cmsOrigin;
        }
        return await this.client.send<ArrayBuffer>({
            url: `${origin}${this.baseUri}/${id}/bin2/${filename}${queries.length > 0 ? `?${queries.join('&')}` : ''}`,
            method: 'get',
            responseType: 'arraybuffer',
        });
    }

    /**
     * Resolve Media ID to URI. This can be useful for get path to a
     * Media file on the BCMS Backend (API endpoint URI)
     */
    toUri(
        /**
         * Media ID
         */
        id: string,
        /**
         * Name of the file. You can use any name or `media.name`.
         */
        filename: string,
        options?: {
            /**
             * Get thumbnail binary data if available
             */
            thumbnail?: boolean;
            /**
             * Get WEBP binary data if available
             */
            webp?: boolean;
            /**
             * Use specified size transform. It must be one of values
             * form `media.sizeTransforms`
             */
            sizeTransform?: string;
        },
    ) {
        const queries: string[] = [];
        if (options) {
            if (options.webp) {
                queries.push('webp=t');
            }
            if (options.sizeTransform) {
                queries.push(`sizeT=${options.sizeTransform}`);
            }
            if (options.thumbnail) {
                queries.push(`tmb=t`);
            }
        }
        queries.push(
            `apiKey=${this.client.apiKeyInfo.id}.${this.client.apiKeyInfo.secret}`,
        );
        let uri = this.baseUri
            .replace(':instanceId', this.client.instanceId)
            .replace(':orgId', this.client.orgId);
        uri += `/${id}/bin2/${encodeURIComponent(filename)}`;
        if (queries.length > 0) {
            uri += '?' + queries.join('&');
        }
        return uri;
    }

    /**
     * Convert Media object to MediaExtended object
     */
    private toMediaExtended(
        /**
         * Media to be extended
         */
        media: Media,
    ): MediaExtended {
        return {
            ...media,
            bin: async (options) => {
                return this.getMediaBin(media._id, media.name, options);
            },
            thumbnail: async () => {
                return this.getMediaBin(media._id, media.name, {
                    thumbnail: true,
                });
            },
        };
    }
}
