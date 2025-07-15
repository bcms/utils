import { useRuntimeConfig } from '#app';
import { Client } from '@thebcms/client';
import type { BcmsNuxtRuntimeConfig } from '~/src/module';

/**
 * Returns the BCMS client and whether it's a private client or not.
 *
 * return [client, isPrivateClient]
 */
export function useBcmsClient(): [Client, boolean] {
    const runtimeConfig = useRuntimeConfig();
    const clientConfig =
        (runtimeConfig.bcms as BcmsNuxtRuntimeConfig)?.clientConfig ||
        (runtimeConfig.public.bcms as BcmsNuxtRuntimeConfig).clientConfig;
    const isPrivateClient = !!runtimeConfig.bcms;
    const client = new Client(
        clientConfig.orgId,
        clientConfig.instanceId,
        clientConfig.apiKey,
        {
            useMemCache: clientConfig.useMemCache,
            debug: clientConfig.debug,
            enableSocket: clientConfig.enableSocket,
            injectSvg: clientConfig.injectSvg,
            cmsOrigin: clientConfig.cmsOrigin,
        },
    );
    return [client, isPrivateClient];
}

/**
 * Returns the BCMS private client.
 */
export function useBcmsPrivate(): Client {
    const runtimeConfig = useRuntimeConfig();
    if (runtimeConfig.bcms === undefined) {
        throw new Error(
            'You cannot use private BCMS client on the client side (server side only)',
        );
    }
    const clientConfig = (runtimeConfig.bcms as BcmsNuxtRuntimeConfig)
        .clientConfig;
    const client = new Client(
        clientConfig.orgId,
        clientConfig.instanceId,
        clientConfig.apiKey,
        {
            useMemCache: clientConfig.useMemCache,
            debug: clientConfig.debug,
            enableSocket: clientConfig.enableSocket,
            injectSvg: clientConfig.injectSvg,
            cmsOrigin: clientConfig.cmsOrigin,
        },
    );
    return client;
}

/**
 * Returns the BCMS public client.
 */
export function useBcmsPublic(): Client {
    const runtimeConfig = useRuntimeConfig();
    const clientConfig = (runtimeConfig.public.bcms as BcmsNuxtRuntimeConfig)
        .clientConfig;
    const client = new Client(
        clientConfig.orgId,
        clientConfig.instanceId,
        clientConfig.apiKey,
        {
            useMemCache: clientConfig.useMemCache,
            debug: clientConfig.debug,
            enableSocket: clientConfig.enableSocket,
            injectSvg: clientConfig.injectSvg,
            cmsOrigin: clientConfig.cmsOrigin,
        },
    );
    return client;
}
