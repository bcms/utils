import type { Client } from '@thebcms/client/main';
import { MemCache } from '@thebcms/utils/mem-cache';
import type {
    ControllerItemResponse,
    ControllerItemsResponse,
    Group,
    GroupWhereIsItUsedResult,
} from '@thebcms/types';

export class GroupHandler {
    private baseUri = `/api/v3/org/:orgId/instance/:instanceId/group`;
    private cache = new MemCache<Group>('_id');
    private latch: {
        [name: string]: boolean;
    } = {};

    constructor(private client: Client) {
        if (this.client.enableSocket) {
            this.client.socket.register('group', async (data) => {
                if (data.type === 'update') {
                    const cacheHit = this.cache.findById(data.groupId);
                    if (cacheHit) {
                        await this.getById(data.groupId, true);
                    }
                } else {
                    this.cache.remove(data.groupId);
                }
            });
        }
    }

    async whereIsItUsed(id: string) {
        return await this.client.send<GroupWhereIsItUsedResult>({
            url: `${this.baseUri}/${id}/where-is-it-used`,
        });
    }

    async getAll(skipCache?: boolean) {
        if (!skipCache && this.client.useMemCache && this.latch.all) {
            return this.cache.items;
        }
        const res = await this.client.send<ControllerItemsResponse<Group>>({
            url: `${this.baseUri}/all`,
        });
        if (this.client.useMemCache) {
            this.cache.set(res.items);
            this.latch.all = true;
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
        const res = await this.client.send<ControllerItemResponse<Group>>({
            url: `${this.baseUri}/${id}`,
        });
        if (this.client.useMemCache) {
            this.cache.set(res.item);
        }
        return res.item;
    }
}
