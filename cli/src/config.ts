import type { ObjectSchema } from '@thebcms/utils/object-utility';

export interface BCMSConfig {
    client?: {
        origin?: string;
        apiKey: string;
    };
}

export const BCMSConfigSchema: ObjectSchema = {
    client: {
        __type: 'object',
        __required: false,
        __child: {
            origin: {
                __type: 'string',
                __required: false,
            },
            apiKey: {
                __type: 'string',
                __required: true,
            },
        },
    },
};
