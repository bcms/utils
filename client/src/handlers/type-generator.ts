import { Client } from '@thebcms/client/main';
import {
    TypeGeneratorFile,
    TypeGeneratorLanguage,
} from '@thebcms/client/types/_cloud/type-generator';
import { ControllerItemsResponse } from '@thebcms/client/types/_cloud/util';

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
