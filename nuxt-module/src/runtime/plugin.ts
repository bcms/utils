import { defineNuxtPlugin } from '#app';
import { Client } from '@thebcms/client';
import type { BcmsNuxtRuntimeConfig } from '~/src/module';

export default defineNuxtPlugin((nuxtApp) => {
    const clientConfig =
        (nuxtApp.$config.bcms as BcmsNuxtRuntimeConfig)?.clientConfig ||
        (nuxtApp.$config.public.bcms as BcmsNuxtRuntimeConfig).clientConfig;
    const isPrivateClient = !!nuxtApp.$config.bcms;
    const client = new Client(
        clientConfig.orgId,
        clientConfig.instanceId,
        clientConfig.apiKey,
        {
            useMemCache: clientConfig.useMemCache,
            debug: clientConfig.debug,
            enableSocket: clientConfig.enableSocket,
            injectSvg: clientConfig.injectSvg,
        },
    );
    return {
        provide: {
            bcmsClient: client,
            isPrivateClient,
        },
    };
});
