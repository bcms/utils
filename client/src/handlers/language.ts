import type { Client } from '@thebcms/client/main';
import { MemCache } from '@thebcms/client/util';
import type { Language } from '@thebcms/client/types/_cloud/language/models/main';
import type {
    ControllerItemResponse,
    ControllerItemsResponse,
} from '@thebcms/client/types/_cloud/util/controller';

export class LanguageHandler {
    private baseUri = `/api/v3/org/:orgId/instance/:instanceId/language`;
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

    async getAll(skipCache?: boolean) {
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

    async getById(id: string, skipCache?: boolean) {
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
