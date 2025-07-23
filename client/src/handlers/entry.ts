import type { Client } from '@thebcms/client/main';
import type {
    ControllerItemResponse,
    ControllerItemsResponse,
    Entry,
    EntryCreateBody,
    EntryLite,
    EntryParsed,
    EntryStatusValue,
    EntryUpdateBody,
    Media,
    Template,
} from '@thebcms/types';
import { MemCache } from '@thebcms/utils/mem-cache';
import type { EntryContentNode } from '@thebcms/types/entry/models/content';
import { parsedPropsToRawProps } from '@thebcms/client/util/entry';

export type EntryParsedDataPropTypes =
    | string
    | number
    | boolean
    | { mediaId: string; altText?: string; caption?: string }
    | { entryId: string; templateId: string }
    | EntryParsedDataProps
    | { timestamp: number; timezoneOffset: number }
    | { nodes: EntryContentNode[] }
    | Array<
          | string
          | number
          | boolean
          | { mediaId: string; altText?: string; caption?: string }
          | { entryId: string; templateId: string }
          | EntryParsedDataProps
          | { timestamp: number; timezoneOffset: number }
          | { nodes: EntryContentNode[] }
      >;

export interface EntryParsedDataProps {
    [key: string]: EntryParsedDataPropTypes;
}

export interface EntryParsedUpdateData {
    lng: string;
    status?: string;
    meta: EntryParsedDataProps;
    content: EntryContentNode[];
}

export interface EntryParsedCreateData {
    statuses: EntryStatusValue[];
    meta: Array<{
        lng: string;
        data: EntryParsedDataProps;
    }>;
    content: Array<{
        lng: string;
        nodes: EntryContentNode[];
    }>;
}

/**
 * Utility class for working with BCMS Entries.
 */
export class EntryHandler {
    private templates: Template[] | null = null;
    private baseUri(templateId: string) {
        return `/api/v3/org/:orgId/instance/:instanceId/template/${templateId}/entry`;
    }
    private latch: {
        [name: string]: boolean;
    } = {};
    private cacheLite = new MemCache<EntryLite>('_id');
    private cacheRaw = new MemCache<Entry>('_id');
    private cacheParse = new MemCache<EntryParsed>('_id');

    constructor(private client: Client) {
        if (this.client.enableSocket) {
            this.client.socket.register('entry', async (data) => {
                if (this.client.useMemCache) {
                    if (data.type === 'update') {
                        this.latch = {};
                        this.cacheParse.remove(
                            this.cacheParse.items.map((e) => e._id),
                        );
                        this.cacheRaw.remove(
                            this.cacheRaw.items.map((e) => e._id),
                        );
                        this.cacheLite.remove(
                            this.cacheLite.items.map((e) => e._id),
                        );
                    } else {
                        this.cacheLite.remove(data.entryId);
                        this.cacheParse.remove(data.entryId);
                        this.cacheRaw.remove(data.entryId);
                    }
                }
            });
        }
    }

    /**
     * Resolve a Template name or ID to the Template object. If a Template
     * with provided name or ID does not exist, method will throw an error.
     */
    private async findTemplateByName(
        /**
         * ID or Name of a Template to find
         */
        idOrName: string,
    ) {
        if (this.client.useMemCache) {
            this.templates = await this.client.template.getAll();
        } else if (!this.templates) {
            this.templates = await this.client.template.getAll();
        }
        const template = this.templates.find(
            (e) => e.name === idOrName || e._id === idOrName,
        );
        if (!template) {
            throw Error(`Template with Name or ID "${idOrName}" is not found"`);
        }
        return template;
    }

    /**
     * Get all Entries lite models for specified Template
     */
    async getAllLite(
        /**
         * Template name or ID
         */
        templateIdOrName: string,
        /**
         * If set to `true` cache check will be skipped
         */
        skipCache?: boolean,
    ) {
        const template = await this.findTemplateByName(templateIdOrName);
        const cacheKey = `all_lite_${template._id}`;
        if (!skipCache && this.client.useMemCache && this.latch[cacheKey]) {
            return this.cacheLite.items.filter(
                (e) => e.templateId === template._id,
            );
        }
        const res = await this.client.send<ControllerItemsResponse<EntryLite>>({
            url: `${this.baseUri(template._id)}/all/lite`,
        });
        if (this.client.useMemCache) {
            this.cacheLite.set(res.items);
            this.latch[cacheKey] = true;
        }
        return res.items;
    }

    /**
     * Get all parsed Entries for specified Template
     */
    async getAll(
        /**
         * Template name or ID
         */
        templateIdOrName: string,
        /**
         * If set to `true` cache check will be skipped
         */
        skipCache?: boolean,
    ) {
        const template = await this.findTemplateByName(templateIdOrName);
        const cacheKey = `all_parse_${template._id}`;
        if (!skipCache && this.client.useMemCache && this.latch[cacheKey]) {
            return this.cacheParse.items.filter(
                (e) => e.templateId === template._id,
            );
        }
        const res = await this.client.send<
            ControllerItemsResponse<EntryParsed>
        >({
            url: `${this.baseUri(template._id)}/all/parsed`,
        });
        if (this.client.injectSvg) {
            await this.injectMediaSvg(res.items);
        }
        if (this.client.useMemCache) {
            this.cacheParse.set(res.items);
            this.latch[cacheKey] = true;
        }
        return res.items;
    }

    /**
     * Get all Entries raw models for specified Template. Raw model of an
     * Entry is a model that is used internally by the BCMS backend. It is
     * hard to work with which is the reason why Entry Parsed model exists.
     *
     * If you do not need to work with Raw model, it is suggested to use
     * `getAll(...)` method instead.
     */
    async getAllRaw(
        /**
         * Template name or ID
         */
        templateIdOrName: string,
        /**
         * If set to `true` cache check will be skipped
         */
        skipCache?: boolean,
    ) {
        const template = await this.findTemplateByName(templateIdOrName);
        const cacheKey = `all_raw_${template._id}`;
        if (!skipCache && this.client.useMemCache && this.latch[cacheKey]) {
            return this.cacheRaw.items.filter(
                (e) => e.templateId === template._id,
            );
        }
        const res = await this.client.send<ControllerItemsResponse<Entry>>({
            url: `${this.baseUri(template._id)}/all`,
        });
        if (this.client.useMemCache) {
            this.cacheRaw.set(res.items);
            this.latch[cacheKey] = true;
        }
        return res.items;
    }

    /**
     * Get all parsed Entries for specified Template with specified Status
     */
    async getAllByStatus(
        /**
         * Template name or ID
         */
        templateIdOrName: string,
        /**
         * Can be an ID or Label of an Entry Status
         */
        status: string,
        /**
         * If set to `true` cache check will be skipped
         */
        skipCache?: boolean,
    ) {
        const template = await this.findTemplateByName(templateIdOrName);
        const allCacheKey = `all_parse_${template._id}`;
        const cacheKey = `all_parse_${template._id}_status_${status}`;
        if (
            !skipCache &&
            this.client.useMemCache &&
            (this.latch[cacheKey] || this.latch[allCacheKey])
        ) {
            return this.cacheParse.items.filter(
                (e) =>
                    e.templateId === template._id &&
                    e.statuses.find(
                        (s) => s.id === status || s.label === status,
                    ),
            );
        }
        const res = await this.client.send<
            ControllerItemsResponse<EntryParsed>
        >({
            url: `${this.baseUri(template._id)}/all_by_status/${status}/parsed`,
        });
        if (this.client.injectSvg) {
            await this.injectMediaSvg(res.items);
        }
        if (this.client.useMemCache) {
            this.cacheParse.set(res.items);
            this.latch[cacheKey] = true;
        }
        return res.items;
    }

    /**
     * Get all Entries raw models for specified Template. Raw model of an
     * Entry is a model that is used internally by the BCMS backend. It is
     * hard to work with which is the reason why Entry Parsed model exists.
     *
     * If you do not need to work with Raw model, it is suggested to use
     * `getAll(...)` method instead.
     */
    async getAllRawByStatus(
        /**
         * Template name or ID
         */
        templateIdOrName: string,
        /**
         * Can be an ID or Label of an Entry Status
         */
        status: string,
        /**
         * If set to `true` cache check will be skipped
         */
        skipCache?: boolean,
    ) {
        const template = await this.findTemplateByName(templateIdOrName);
        const allCacheKey = `all_raw_${template._id}`;
        const cacheKey = `all_raw_${template._id}_status_${status}`;
        if (
            !skipCache &&
            this.client.useMemCache &&
            (this.latch[cacheKey] || this.latch[allCacheKey])
        ) {
            const statuses = await this.client.entryStatus.getAll();
            const statusData = statuses.find(
                (e) => e._id === status || e.label === status,
            );
            if (!statusData) {
                return [];
            }
            return this.cacheRaw.items.filter(
                (e) =>
                    e.templateId === template._id &&
                    e.statuses.find((s) => s.id === statusData._id),
            );
        }
        const res = await this.client.send<ControllerItemsResponse<Entry>>({
            url: `${this.baseUri(template._id)}/all_by_status/${status}`,
        });
        if (this.client.useMemCache) {
            this.cacheRaw.set(res.items);
            this.latch[cacheKey] = true;
        }
        return res.items;
    }

    /**
     * Get an Entry Lite model by ID
     */
    async getByIdLite(
        /**
         * ID of an Entry
         */
        entryId: string,
        /**
         * Template name or ID. This must be a Template for specified
         * Entry ID
         */
        templateIdOrName: string,
        /**
         * If set to `true` cache check will be skipped
         */
        skipCache?: boolean,
    ) {
        const template = await this.findTemplateByName(templateIdOrName);
        if (!skipCache && this.client.useMemCache) {
            const cacheHit = this.cacheLite.find(
                (e) => e._id === entryId && e.templateId === template._id,
            );
            if (cacheHit) {
                return cacheHit;
            }
        }
        const res = await this.client.send<ControllerItemResponse<EntryLite>>({
            url: `${this.baseUri(template._id)}/${entryId}/lite`,
        });
        if (this.client.useMemCache) {
            this.cacheLite.set(res.item);
        }
        return res.item;
    }

    /**
     * Get an Entry Parsed model by ID
     */
    async getById(
        /**
         * ID of an Entry
         */
        entryId: string,
        /**
         * Template name or ID. This must be a Template for specified
         * Entry ID
         */
        templateIdOrName: string,
        /**
         * If set to `true` cache check will be skipped
         */
        skipCache?: boolean,
    ) {
        const template = await this.findTemplateByName(templateIdOrName);
        if (!skipCache && this.client.useMemCache) {
            const cacheHit = this.cacheParse.find(
                (e) => e.templateId === template._id && e._id === entryId,
            );
            if (cacheHit) {
                return cacheHit;
            }
        }
        const res = await this.client.send<ControllerItemResponse<EntryParsed>>(
            {
                url: `${this.baseUri(template._id)}/${entryId}/parse`,
            },
        );
        if (this.client.injectSvg) {
            await this.injectMediaSvg([res.item]);
        }
        if (this.client.useMemCache) {
            this.cacheParse.set(res.item);
        }
        return res.item;
    }

    /**
     * Get an Entry Parsed model by an Entry slug
     */
    async getBySlug(
        /**
         * Slug of an Entry
         */
        entrySlug: string,
        /**
         * Template name or ID. This must be a Template for specified
         * Entry slug
         */
        templateIdOrName: string,
        /**
         * If set to `true` cache check will be skipped
         */
        skipCache?: boolean,
    ) {
        const template = await this.findTemplateByName(templateIdOrName);
        if (!skipCache && this.client.useMemCache) {
            const cacheHit = this.cacheParse.find(
                (entry) =>
                    entry.templateId === template._id &&
                    Object.keys(entry.meta).find((key) => {
                        return entry.meta[key].slug === entrySlug;
                    }),
            );
            if (cacheHit) {
                return cacheHit;
            }
        }
        const res = await this.client.send<ControllerItemResponse<EntryParsed>>(
            {
                url: `${this.baseUri(template._id)}/${entrySlug}/parse`,
            },
        );
        if (this.client.injectSvg) {
            await this.injectMediaSvg([res.item]);
        }
        if (this.client.useMemCache) {
            this.cacheParse.set(res.item);
        }
        return res.item;
    }

    /**
     * Get an Entry Raw model by ID. Raw model of an
     * Entry is a model that is used internally by the BCMS backend. It is
     * hard to work with which is the reason why Entry Parsed model exists.
     *
     * If you do not need to work with Raw model, it is suggested to use
     * `getById(...)` method instead.
     */
    async getByIdRaw(
        /**
         * ID of an Entry
         */
        entryId: string,
        /**
         * Template name or ID. This must be a Template for specified
         * Entry ID
         */
        templateIdOrName: string,
        /**
         * If set to `true` cache check will be skipped
         */
        skipCache?: boolean,
    ) {
        const template = await this.findTemplateByName(templateIdOrName);
        if (!skipCache && this.client.useMemCache) {
            const cacheHit = this.cacheRaw.find(
                (e) => e._id === entryId && e.templateId === template._id,
            );
            if (cacheHit) {
                return cacheHit;
            }
        }
        const res = await this.client.send<ControllerItemResponse<Entry>>({
            url: `${this.baseUri(template._id)}/${entryId}`,
        });
        if (this.client.useMemCache) {
            this.cacheRaw.set(res.item);
        }
        return res.item;
    }

    /**
     * Create an Entry for specified Template. Have in mind that API Key
     * need to have access to create Entries for specified Template.
     */
    async create(
        /**
         * ID or name of a Template for which entry should be created
         */
        templateIdOrName: string,
        /**
         * Data with which to create an Entry
         */
        entryParsedData: EntryParsedCreateData,
    ) {
        const data: EntryCreateBody = {
            meta: [],
            content: entryParsedData.content.map((content) => {
                return {
                    lng: content.lng,
                    nodes: content.nodes,
                    plainText: '',
                };
            }),
            statuses: entryParsedData.statuses.map((status) => {
                return {
                    lng: status.lng,
                    id: status.id,
                };
            }),
        };
        const template = await this.findTemplateByName(templateIdOrName);
        const groups = await this.client.group.getAll();
        for (let i = 0; i < entryParsedData.meta.length; i++) {
            const meta = entryParsedData.meta[i];
            data.meta.push({
                lng: meta.lng,
                props: parsedPropsToRawProps(
                    meta.data,
                    template.props,
                    [],
                    groups,
                    'entry',
                ),
            });
        }
        const res = await this.client.send<ControllerItemResponse<Entry>>({
            url: `${this.baseUri(template._id)}/create`,
            method: 'POST',
            data,
        });
        if (this.client.useMemCache) {
            this.cacheRaw.set(res.item);
            this.cacheParse.set(
                await this.getById(res.item._id, res.item.templateId, true),
            );
        }
        return res.item;
    }

    /**
     * Create an Entry for specified Template using raw entry data.
     * Have in mind that API Key need to have access to create Entries for
     * specified Template.
     *
     * Raw Entry model is pretty complex. It is recommended to use
     * `update(...)` if you do not have specific reasons to work with raw
     * Entry model.
     */
    async createRaw(
        /**
         * Template name or ID
         */
        templateIdOrName: string,
        /**
         * Raw data with which to create an Entry
         */
        data: EntryCreateBody,
    ) {
        const template = await this.findTemplateByName(templateIdOrName);
        const res = await this.client.send<ControllerItemResponse<Entry>>({
            url: `${this.baseUri(template._id)}/create`,
            method: 'POST',
            data,
        });
        if (this.client.useMemCache) {
            this.cacheRaw.set(res.item);
            this.cacheParse.set(
                await this.getById(res.item._id, res.item.templateId, true),
            );
        }
        return res.item;
    }

    /**
     * Update an Entry for specified Template. Have in mind that API Key
     * need to have access to update Entries for specified Template.
     */
    async update(
        /**
         * Template name or ID
         */
        templateIdOrName: string,
        /**
         * ID of an Entry to update
         */
        entryId: string,
        /**
         * Entry update data
         */
        entryParsedData: EntryParsedUpdateData,
    ) {
        const data: EntryUpdateBody = {
            status: entryParsedData.status,
            lng: entryParsedData.lng,
            content: {
                nodes: entryParsedData.content,
            },
            meta: {
                props: [],
            },
        };
        const template = await this.findTemplateByName(templateIdOrName);
        const entry = await this.getByIdRaw(entryId, template._id);
        const entryMeta = entry.meta.find((e) => e.lng === entryParsedData.lng);
        const groups = await this.client.group.getAll();
        data.meta.props = parsedPropsToRawProps(
            entryParsedData.meta,
            template.props,
            entryMeta ? entryMeta.props : [],
            groups,
            'entry',
        );
        const res = await this.client.send<ControllerItemResponse<Entry>>({
            url: `${this.baseUri(template._id)}/${entryId}/update`,
            method: 'PUT',
            data,
        });
        if (this.client.useMemCache) {
            this.cacheRaw.set(res.item);
            this.cacheParse.set(
                await this.getById(res.item._id, res.item.templateId, true),
            );
        }
        return res.item;
    }

    /**
     * Update an existing Entry for specified Template using raw entry data.
     * Have in mind that API Key need to have access to update Entries for
     * specified Template.
     *
     * Raw Entry model is pretty complex. It is recommended to use
     * `update(...)` if you do not have specific reasons to work with raw
     * Entry model.
     */
    async updateRaw(
        /**
         * Template name or ID
         */
        templateIdOrName: string,
        /**
         * ID of an Entry to update
         */
        entryId: string,
        /**
         * Entry update data
         */
        data: EntryUpdateBody,
    ) {
        const template = await this.findTemplateByName(templateIdOrName);
        const res = await this.client.send<ControllerItemResponse<Entry>>({
            url: `${this.baseUri(template._id)}/${entryId}/update`,
            method: 'PUT',
            data,
        });
        if (this.client.useMemCache) {
            this.cacheRaw.set(res.item);
            this.cacheParse.set(
                await this.getById(res.item._id, res.item.templateId, true),
            );
        }
        return res.item;
    }

    /**
     * Delete Entry by ID. Have in mind that API Key needs to have access to
     * delete Entries from specified Template.
     */
    async deleteById(
        /**
         * ID of an Entry with should be deleted
         */
        entryId: string,
        /**
         * Template name or ID
         */
        templateIdOrName: string,
    ) {
        const template = await this.findTemplateByName(templateIdOrName);
        const res = await this.client.send<ControllerItemResponse<Entry>>({
            url: `${this.baseUri(template._id)}/${entryId}`,
            method: 'DELETE',
        });
        if (this.client.useMemCache) {
            this.cacheRaw.remove(res.item._id);
            this.cacheParse.remove(res.item._id);
            this.cacheLite.remove(res.item._id);
        }
        return res.item;
    }

    /**
     * Inject SVG data to Media properties of passed Entries. This method
     * will mutate Entries them self. This method should be called only if
     * `injectSvg === true`
     */
    private async injectMediaSvg(entries: EntryParsed[]): Promise<void> {
        const svgCache: {
            [mediaId: string]: string;
        } = {};
        const searchObject: (obj: any) => Promise<void> = async (obj: any) => {
            const med = obj as Media;
            if (
                med.type === 'SVG' &&
                med._id &&
                med.name &&
                med.width &&
                med.height &&
                med.mimetype
            ) {
                if (svgCache[med._id]) {
                    obj.svg = svgCache[med._id];
                } else {
                    const svgBuffer = await this.client.media.getMediaBin(
                        med._id,
                        med.name,
                    );
                    obj.svg = new TextDecoder().decode(svgBuffer);
                    svgCache[med._id] = obj.svg;
                }
            } else {
                for (const key in obj) {
                    if (obj[key] && typeof obj[key] === 'object') {
                        if (obj[key] instanceof Array) {
                            for (let i = 0; i < obj[key].length; i++) {
                                if (
                                    obj[key][i] &&
                                    typeof obj[key][i] === 'object'
                                ) {
                                    await searchObject(obj[key][i]);
                                } else {
                                    break;
                                }
                            }
                        } else {
                            await searchObject(obj[key]);
                        }
                    }
                }
            }
        };
        for (let i = 0; i < entries.length; i++) {
            await searchObject(entries[i]);
        }
    }
}
