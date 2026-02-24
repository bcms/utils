import type { Client } from '@thebcms/client/main';
import { MemCache } from '@thebcms/utils/mem-cache';
import type {
    ControllerItemResponse,
    ControllerItemsResponse,
    Language,
} from '@thebcms/types';

/**
 * Utility class for working with BCMS Languages.
 */
export class LanguageHandler {
    private baseUri = `/api/v3/instance/:instanceId/language`;
    private cache = new MemCache<Language>('_id');
    private latch: {
        [name: string]: boolean;
    } = {};

    constructor(private client: Client) {
        if (this.client.enableSocket) {
            this.client.socket.register('language', async (data) => {
                if (data.type === 'update') {
                    const cacheHit = this.cache.findById(data.languageId);
                    if (cacheHit) {
                        await this.getById(data.languageId, true);
                    }
                } else {
                    this.cache.remove(data.languageId);
                }
            });
        }
    }

    /**
     * Get all Languages
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
        const res = await this.client.send<ControllerItemsResponse<Language>>({
            url: `${this.baseUri}/all`,
        });
        if (this.client.useMemCache) {
            this.cache.set(res.items);
        }
        return res.items;
    }

    /**
     * Get a Language by ID
     * @param id
     * @param skipCache
     */
    async getById(
        /**
         * Language ID
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
        const res = await this.client.send<ControllerItemResponse<Language>>({
            url: `${this.baseUri}/${id}`,
        });
        if (this.client.useMemCache) {
            this.cache.set(res.item);
        }
        return res.item;
    }
}
