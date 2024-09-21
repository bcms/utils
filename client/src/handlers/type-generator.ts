import type { Client } from '@thebcms/client/main';
import type {
    ControllerItemsResponse,
    TypeGeneratorFile,
    TypeGeneratorLanguage,
} from '@thebcms/types';

export class TypeGeneratorHandler {
    private baseUri = '/api/v3/org/:orgId/instance/:instanceId/type-generator';

    constructor(private client: Client) {}

    async getFiles(lang: TypeGeneratorLanguage) {
        const res = await this.client.send<
            ControllerItemsResponse<TypeGeneratorFile>
        >({
            url: `${this.baseUri}/${lang}`,
        });
        return res.items;
    }
}
