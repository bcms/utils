import type { Client } from '@thebcms/client/main';
import { MemCache } from '@thebcms/utils/mem-cache';
import type {
    ControllerItemResponse,
    ControllerItemsResponse,
    Group,
    GroupWhereIsItUsedResult,
} from '@thebcms/types';

/**
 * Utility class for working with BCMS Groups.
 */
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

    /**
     * Method which return pointers to where specified Group has been used.
     */
    async whereIsItUsed(
        /**
         * Group ID
         */
        id: string,
    ) {
        return await this.client.send<GroupWhereIsItUsedResult>({
            url: `${this.baseUri}/${id}/where-is-it-used`,
        });
    }

    /**
     * Get all Groups
     * @param skipCache
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
        const res = await this.client.send<ControllerItemsResponse<Group>>({
            url: `${this.baseUri}/all`,
        });
        if (this.client.useMemCache) {
            this.cache.set(res.items);
            this.latch.all = true;
        }
        return res.items;
    }

    /**
     * Get a Group by ID
     */
    async getById(
        /**
         * Group ID
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
        const res = await this.client.send<ControllerItemResponse<Group>>({
            url: `${this.baseUri}/${id}`,
        });
        if (this.client.useMemCache) {
            this.cache.set(res.item);
        }
        return res.item;
    }
}
