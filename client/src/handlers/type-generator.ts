import type { Client } from '@thebcms/client/main';
import type {
    ControllerItemsResponse,
    TypeGeneratorFile,
    TypeGeneratorLanguage,
} from '@thebcms/types';

/**
 * Utility class for working with BCMS Type Generator.
 */
export class TypeGeneratorHandler {
    private baseUri = '/api/v3/instance/:instanceId/type-generator';

    constructor(private client: Client) {}

    /**
     * Get type files for specified language
     */
    async getFiles(
        /**
         * Language for which to return types
         */
        lang: TypeGeneratorLanguage,
    ) {
        const res = await this.client.send<
            ControllerItemsResponse<TypeGeneratorFile>
        >({
            url: `${this.baseUri}/${lang}`,
        });
        return res.items;
    }
}
