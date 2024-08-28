import type { ObjectSchema } from '@thebcms/cli/util';

export interface BCMSConfig {
    client?: {
        origin?: string;
        orgId: string;
        instanceId: string;
        apiKey: {
            id: string;
            secret: string;
        };
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
            orgId: {
                __type: 'string',
                __required: true,
            },
            instanceId: {
                __type: 'string',
                __required: true,
            },
            apiKey: {
                __type: 'object',
                __required: true,
                __child: {
                    id: {
                        __type: 'string',
                        __required: true,
                    },
                    secret: {
                        __type: 'string',
                        __required: true,
                    },
                },
            },
        },
    },
};
