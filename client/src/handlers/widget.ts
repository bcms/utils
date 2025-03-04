import type { Client } from '@thebcms/client/main';
import { MemCache } from '@thebcms/utils/mem-cache';
import type {
    ControllerItemResponse,
    ControllerItemsResponse,
    Widget,
    WidgetWhereIsItUsedResult,
} from '@thebcms/types';

/**
 * Utility class for working with BCMS Widgets.
 */
export class WidgetHandler {
    private baseUri = `/api/v3/org/:orgId/instance/:instanceId/widget`;
    private cache = new MemCache<Widget>('_id');
    private latch: {
        [name: string]: boolean;
    } = {};

    constructor(private client: Client) {
        if (this.client.enableSocket) {
            this.client.socket.register('widget', async (data) => {
                if (data.type === 'update') {
                    const cacheHit = this.cache.findById(data.widgetId);
                    if (cacheHit) {
                        await this.getById(data.widgetId, true);
                    }
                } else {
                    this.cache.remove(data.widgetId);
                }
            });
        }
    }

    /**
     * Returns pointers where specified Widget has been used.
     */
    async whereIsItUsed(
        /**
         * Widget ID for which to do search
         */
        id: string,
    ) {
        return await this.client.send<WidgetWhereIsItUsedResult>({
            url: `${this.baseUri}/${id}/where-is-it-used`,
        });
    }

    /**
     * Get all Widgets
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
        const res = await this.client.send<ControllerItemsResponse<Widget>>({
            url: `${this.baseUri}/all`,
        });
        if (this.client.useMemCache) {
            this.cache.set(res.items);
            this.latch.all = true;
        }
        return res.items;
    }

    /**
     * Get Widget by ID
     */
    async getById(
        /**
         * Widget ID
         */
        id: string,
        /**
         * If set to `true` cache check will be skipped
         */
        skipCache?: boolean,
    ) {
        if (!skipCache && this.client.useMemCache) {
            const cacheHit = this.cache.findById(id);
            if (cacheHit) {
                return cacheHit;
            }
        }
        const res = await this.client.send<ControllerItemResponse<Widget>>({
            url: `${this.baseUri}/${id}`,
        });
        if (this.client.useMemCache) {
            this.cache.set(res.item);
        }
        return res.item;
    }
}
