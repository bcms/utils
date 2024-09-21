import type { Client } from '@thebcms/client/main';
import { Buffer } from 'buffer';
import type {
    ControllerItemResponse,
    ControllerItemsResponse,
    Media,
} from '@thebcms/types';
import { MemCache } from '@thebcms/utils/mem-cache';

export interface MediaExtended extends Media {
    svg?: string;
    bin(options?: { webp?: boolean; sizeTransform?: string }): Promise<Buffer>;
    thumbnail(): Promise<Buffer>;
}

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

    resolvePath(media: Media, allMedia: Media[]): string {
        if (media.parentId) {
            const parent = allMedia.find((e) => e._id === media.parentId);
            if (parent) {
                return `${this.resolvePath(parent, allMedia)}/${media.name}`;
            }
        }
        return '/' + media.name;
    }

    async getAll(skipCache?: boolean): Promise<MediaExtended[]> {
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
                item.svg = Buffer.from(svgBuffer).toString();
            }
            items.push(item);
        }
        if (this.client.useMemCache) {
            this.cache.set(items);
            this.latch.all = true;
        }
        return items;
    }

    async getById(id: string, skipCache?: boolean): Promise<MediaExtended> {
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
            item.svg = Buffer.from(svgBuffer).toString();
        }
        if (this.client.useMemCache) {
            this.cache.set(item);
        }
        return item;
    }

    async getMediaBin(
        id: string,
        filename: string,
        options?: {
            thumbnail?: boolean;
            webp?: boolean;
            sizeTransform?: string;
        },
    ): Promise<Buffer> {
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
        return await this.client.send<Buffer>({
            url: `${this.baseUri}/${id}/bin2/${filename}${queries.length > 0 ? `?${queries.join('&')}` : ''}`,
            method: 'get',
            responseType: 'arraybuffer',
        });
    }

    toUri(
        id: string,
        filename: string,
        options?: {
            thumbnail?: boolean;
            webp?: boolean;
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
        uri += `/${id}/bin2/${filename}`;
        if (queries.length > 0) {
            uri += '?' + queries.join('&');
        }
        return uri;
    }

    private toMediaExtended(media: Media): MediaExtended {
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
