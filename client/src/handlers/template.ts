import type { Client } from '@thebcms/client/main';
import { MemCache } from '@thebcms/utils/mem-cache';
import type {
    ControllerItemResponse,
    ControllerItemsResponse,
    Template,
    TemplateUpdateBody,
    TemplateWhereIsItUsedResult,
} from '@thebcms/types';

/**
 * Utility class for working with BCMS Templates.
 */
export class TemplateHandler {
    private baseUri = '/api/v3/org/:orgId/instance/:instanceId/template';
    private latch: {
        [name: string]: boolean;
    } = {};
    private cache = new MemCache<Template>('_id');

    constructor(private client: Client) {
        if (this.client.enableSocket) {
            this.client.socket.register('template', async (data) => {
                if (data.type === 'update') {
                    const cacheHit = this.cache.findById(data.templateId);
                    if (cacheHit) {
                        await this.getById(data.templateId, true);
                    }
                } else {
                    this.cache.remove(data.templateId);
                }
            });
        }
    }

    /**
     * Returns pointers where specified Template has been used.
     */
    async whereIsItUsed(
        /**
         * Template ID for which to do search
         */
        templateId: string,
    ) {
        return await this.client.send<TemplateWhereIsItUsedResult>({
            url: `${this.baseUri}/${templateId}`,
        });
    }

    /**
     * Get all Templates
     */
    async getAll(
        /**
         * If set to `true` cache check will be skipped
         */
        skipCache?: boolean,
    ) {
        if (!skipCache && this.client.useMemCache && this.latch.all) {
            return this.cache.items;
        }
        const res = await this.client.send<ControllerItemsResponse<Template>>({
            url: `${this.baseUri}/all`,
        });
        if (this.client.useMemCache) {
            this.cache.items = res.items;
            this.latch.all = true;
        }
        return res.items;
    }

    /**
     * Get Template by ID
     */
    async getById(
        /**
         * Template ID
         */
        templateId: string,
        /**
         * If set to `true` cache check will be skipped
         */
        skipCache?: boolean,
    ) {
        if (!skipCache && this.client.useMemCache) {
            const cacheHit = this.cache.findById(templateId);
            if (cacheHit) {
                return cacheHit;
            }
        }
        const res = await this.client.send<ControllerItemResponse<Template>>({
            url: `${this.baseUri}/${templateId}`,
        });
        if (this.client.useMemCache) {
            this.cache.set(res.item);
        }
        return res.item;
    }

    /**
     * Update existing Template by ID.
     *
     * Warning: this action will change a Template schema which
     * will have effect on all Entries which are using specified template.
     */
    async update(
        /**
         * ID of a Template which will be updated
         */
        templateId: string,
        /**
         * Template update data
         */
        data: TemplateUpdateBody,
    ) {
        const res = await this.client.send<ControllerItemResponse<Template>>({
            url: `${this.baseUri}/${templateId}/update`,
            method: 'PUT',
            data,
        });
        if (this.client.useMemCache) {
            this.cache.set(res.item);
        }
        return res.item;
    }

    /**
     * Delete a Template by ID
     *
     * Waring: All Entries which are using specified Template will
     * be deleted as fell.
     */
    async deleteById(
        /**
         * ID of a Template to be deleted
         */
        templateId: string,
    ) {
        const res = await this.client.send<ControllerItemResponse<Template>>({
            url: `${this.baseUri}/${templateId}`,
            method: 'DELETE',
        });
        if (this.client.useMemCache) {
            this.cache.remove(templateId);
        }
        return res.item;
    }
}
