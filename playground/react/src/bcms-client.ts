import { Client } from '@thebcms/client';

export const bcmsClient = new Client(
    import.meta.env.VITE_BCMS_ORG_ID,
    import.meta.env.VITE_BCMS_INSTANCE_ID,
    {
        id: import.meta.env.VITE_BCMS_KEY_ID,
        secret: import.meta.env.VITE_BCMS_KEY_SECRET,
    },
    {
        cmsOrigin: import.meta.env.VITE_BCMS_ORIGIN,
        injectSvg: true,
    },
);
