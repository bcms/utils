import type { Client } from '@thebcms/client';

export function useBcmsPrivate(): Client {
    return globalThis.bcmsPrivateClient;
}

export function useBcmsPublic(): Client {
    return globalThis.bcmsPublicClient;
}
