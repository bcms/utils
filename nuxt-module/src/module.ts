import {
    defineNuxtModule,
    createResolver,
    addImportsDir,
    addPlugin,
    addServerPlugin,
    addComponentsDir,
} from '@nuxt/kit';
import type { ClientApiKey, ClientConfig } from '@thebcms/client';
import { Client } from '@thebcms/client';
import { FS } from '@thebcms/utils/fs';
import { ObjectUtility } from '@thebcms/utils/object-utility';
import type { ObjectSchema } from '@thebcms/utils/object-utility';
import path from 'node:path';

export interface BCMSNuxtModuleClientOptions {
    key: ClientApiKey;
    options?: {
        /**
         * Is memory caching active
         */
        useMemCache?: boolean;
        /**
         * Is in debug mode
         */
        debug?: boolean;
        /**
         * Is web socket enabled
         */
        enableSocket?: boolean;
        /**
         * Should SVG data be injected info media object
         */
        injectSvg?: boolean;
    };
}
const bcmsNuxtModuleClientOptionsSchema: ObjectSchema = {
    key: {
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
    options: {
        __type: 'object',
        __required: false,
        __child: {
            useMemCache: {
                __type: 'boolean',
                __required: false,
            },
            debug: {
                __type: 'boolean',
                __required: false,
            },
            enableSocket: {
                __type: 'boolean',
                __required: false,
            },
            injectSvg: {
                __type: 'boolean',
                __required: false,
            },
        },
    },
};

// Module options TypeScript interface definition
export interface ModuleOptions {
    /**
     * Organization ID - Can be obtained on API Key screen
     * on the BCMS dashboard
     */
    orgId: string;
    /**
     * Instance ID - Can be obtained on API Key screen
     * on the BCMS dashboard
     */
    instanceId: string;
    /**
     * URL of the active CMS backend
     */
    apiOrigin?: string;
    /**
     * Private API Key options - This will create the BCMS Client which
     * is available only in the server context.
     */
    privateClientOptions: BCMSNuxtModuleClientOptions;
    /**
     * Public API Key options - This will create the BCMS Client which
     * is available in both server and client contexts.
     */
    publicClientOptions: BCMSNuxtModuleClientOptions;
}
const moduleOptionsSchema: ObjectSchema = {
    orgId: {
        __type: 'string',
        __required: true,
    },
    instanceId: {
        __type: 'string',
        __required: true,
    },
    apiOrigin: {
        __type: 'string',
        __required: false,
    },
    privateClientOptions: {
        __type: 'object',
        __required: true,
        __child: bcmsNuxtModuleClientOptionsSchema,
    },
    publicClientOptions: {
        __type: 'object',
        __required: false,
        __child: bcmsNuxtModuleClientOptionsSchema,
    },
};

export interface BcmsNuxtRuntimeConfig {
    clientConfig: ClientConfig;
}

export default defineNuxtModule<ModuleOptions>({
    meta: {
        name: '@nuxt/bcms',
        configKey: 'bcms',
        compatibility: {
            nuxt: '>=3.0.0',
        },
    },
    // Default configuration options of the Nuxt module
    defaults: {},
    setup(options, nuxt) {
        if (JSON.stringify(options) === '{}') {
            return;
        }
        const checkOptions = ObjectUtility.compareWithSchema(
            options,
            moduleOptionsSchema,
            'nuxtConfig.bcms',
        );
        if (checkOptions) {
            throw new Error('Invalid BCMS options: ' + checkOptions.message);
        }
        const resolver = createResolver(import.meta.url);
        const bcmsPrivate = new Client(
            options.orgId,
            options.instanceId,
            {
                id: options.privateClientOptions.key.id,
                secret: options.privateClientOptions.key.secret,
            },
            options.privateClientOptions.options
                ? {
                      ...options.privateClientOptions.options,
                      cmsOrigin: options.apiOrigin,
                  }
                : { cmsOrigin: options.apiOrigin },
        );
        nuxt.options.runtimeConfig.bcms = {
            clientConfig: bcmsPrivate.getConfig(),
        };
        const bcmsPublic = new Client(
            options.orgId,
            options.instanceId,
            {
                id: options.publicClientOptions.key.id,
                secret: options.publicClientOptions.key.secret,
            },
            options.publicClientOptions.options
                ? {
                      ...options.publicClientOptions.options,
                      cmsOrigin: options.apiOrigin,
                  }
                : {
                      cmsOrigin: options.apiOrigin,
                  },
        );
        nuxt.options.runtimeConfig.public.bcms = {
            clientConfig: bcmsPublic.getConfig(),
        };

        nuxt.options.build.transpile.push(
            '@thebcms/client',
            'form-data',
            'uuid',
        );

        addImportsDir(resolver.resolve('./runtime/composables'));

        addComponentsDir({
            path: resolver.resolve('./runtime/components'),
            extensions: ['ts'],
        });

        addServerPlugin(resolver.resolve('./runtime/nitro-plugin'));

        const fs = new FS(process.cwd());
        nuxt.hook('build:before', async () => {
            const types = await bcmsPrivate.typeGenerator.getFiles('ts');
            for (let i = 0; i < types.length; i++) {
                const type = types[i];
                await fs.save(
                    ['bcms', 'type', 'ts', ...type.path.split('/')],
                    type.content,
                );
            }
            console.log('BCMS types generated');
        });
        nuxt.hook('nitro:config', (nitroConfig) => {
            nitroConfig.imports = nitroConfig.imports || {};
            nitroConfig.imports.imports = nitroConfig.imports.imports || [];

            nitroConfig.imports.imports.push({
                name: 'useBcmsPrivate',
                from: resolver.resolve('./runtime/utils'),
            });
        });
        nuxt.hook('prepare:types', (opts) => {
            const bcmsTypesPath = path.join(
                process.cwd(),
                'bcms',
                'type',
                'ts',
            );
            opts.references.push(
                {
                    path: resolver.resolve('./runtime/utils'),
                },
                {
                    path: bcmsTypesPath,
                },
            );
            opts.tsConfig.compilerOptions ||= {};
            opts.tsConfig.compilerOptions.paths ||= {};
            opts.tsConfig.compilerOptions.paths['#bcms-type'] = [bcmsTypesPath];
        });

        addPlugin({
            src: resolver.resolve('./runtime/plugin'),
            mode: 'all',
        });
    },
});
