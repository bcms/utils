import { Client } from '@thebcms/client';

let client: Client = null as never;

export function getBcmsClient(): Client {
    if (!client) {
        if (!process.env.BCMS_API_KEY) {
            throw Error('BCMS_API_KEY environment variable is not set');
        }
        const apiKey = process.env.BCMS_API_KEY;
        const apiKeyParts = apiKey.split('.');
        if (apiKeyParts.length !== 3) {
            throw Error('BCMS_API_KEY is not formatted correctly');
        }
        client = new Client({
            apiKey,
            cmsOrigin: process.env.BCMS_API_ORIGIN,
            injectSvg: true,
            useMemCache: true,
            enableSocket: true,
        });
        client.socket.connect().catch((err) => {
            console.error('Failed to connect to BCMS socket:', err);
        });
    }
    return client;
}
