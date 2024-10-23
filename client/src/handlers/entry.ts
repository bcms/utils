import type { Client } from '@thebcms/client/main';
import { Buffer } from 'buffer';
import type {
    ControllerItemResponse,
    ControllerItemsResponse,
    Entry,
    EntryCreateBody,
    EntryLite,
    EntryParsed,
    EntryUpdateBody,
    Media,
    Template,
} from '@thebcms/types';
import { MemCache } from '@thebcms/utils/mem-cache';

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
                if (data.type === 'update') {
                    if (this.client.useMemCache) {
                        await this.getById(data.entryId, data.templateId, true);
                        await this.getByIdLite(
                            data.entryId,
                            data.templateId,
                            true,
                        );
                        await this.getByIdRaw(
                            data.entryId,
                            data.templateId,
                            true,
                        );
                    }
                } else {
                    this.cacheLite.remove(data.entryId);
                    this.cacheParse.remove(data.entryId);
                    this.cacheRaw.remove(data.entryId);
                }
            });
        }
    }

    private async findTemplateByName(idOrName: string) {
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

    async getAllLite(templateIdOrName: string, skipCache?: boolean) {
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

    async getAll(templateIdOrName: string, skipCache?: boolean) {
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

    async getAllRaw(templateIdOrName: string, skipCache?: boolean) {
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

    async getByIdLite(
        entryId: string,
        templateIdOrName: string,
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

    async getById(
        entryId: string,
        templateIdOrName: string,
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

    async getBySlug(
        entrySlug: string,
        templateIdOrName: string,
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

    async getByIdRaw(
        entryId: string,
        templateIdOrName: string,
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

    async create(templateIdOrName: string, data: EntryCreateBody) {
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

    async update(templateIdOrName: string, data: EntryUpdateBody) {
        const template = await this.findTemplateByName(templateIdOrName);
        const res = await this.client.send<ControllerItemResponse<Entry>>({
            url: `${this.baseUri(template._id)}/update`,
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

    async deleteById(entryId: string, templateIdOrName: string) {
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
                    obj.svg = Buffer.from(svgBuffer).toString();
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
