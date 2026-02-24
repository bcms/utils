import { Client } from '@thebcms/client/main';

export const client = new Client(
    '6705360c7272c161f4193ade',
    {
        id: '6706353ddd00f6509f552013',
        secret: '8ee31b13bae1a5c328d33cb32f073b0bc319249d477508d12c411ba09fa7c935',
    },
    {
        cmsOrigin: 'http://localhost:8081',
        injectSvg: true,
        useMemCache: true,
        enableSocket: true,
    },
);
