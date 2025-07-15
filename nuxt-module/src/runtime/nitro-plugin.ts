import { useRuntimeConfig } from '#imports';
import { defineNitroPlugin } from 'nitropack/runtime/plugin';
import { Client } from '@thebcms/client';
import type { BcmsNuxtRuntimeConfig } from '~/src/module';

declare global {
    var bcmsPrivateClient: Client;
    var bcmsPublicClient: Client;
}

export default defineNitroPlugin(() => {
    const runtimeConfig = useRuntimeConfig();
    const privateClientConfig = (runtimeConfig.bcms as BcmsNuxtRuntimeConfig)
        .clientConfig;
    const publicClientConfig = (
        runtimeConfig.public.bcms as BcmsNuxtRuntimeConfig
    ).clientConfig;
    const privateClient = new Client(
        privateClientConfig.orgId,
        privateClientConfig.instanceId,
        privateClientConfig.apiKey,
        {
            useMemCache: privateClientConfig.useMemCache,
            debug: privateClientConfig.debug,
            enableSocket: privateClientConfig.enableSocket,
            injectSvg: privateClientConfig.injectSvg,
        },
    );
    const publicClient = new Client(
        publicClientConfig.orgId,
        publicClientConfig.instanceId,
        publicClientConfig.apiKey,
        {
            useMemCache: publicClientConfig.useMemCache,
            debug: publicClientConfig.debug,
            enableSocket: publicClientConfig.enableSocket,
            injectSvg: publicClientConfig.injectSvg,
        },
    );
    globalThis.bcmsPrivateClient = privateClient;
    globalThis.bcmsPublicClient = publicClient;
});
