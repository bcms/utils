export default defineNuxtConfig({
    modules: ['../src/module'],
    devtools: { enabled: true },
    bcms: {
        orgId: process.env.BCMS_ORG_ID,
        instanceId: process.env.BCMS_INSTANCE_ID,
        privateClientOptions: {
            key: {
                id: process.env.BCMS_PRIVATE_KEY_ID,
                secret: process.env.BCMS_PRIVATE_KEY_SECRET,
            },
            options: {
                injectSvg: true,
            },
        },
        publicClientOptions: {
            key: {
                id: process.env.BCMS_PUBLIC_KEY_ID,
                secret: process.env.BCMS_PUBLIC_KEY_SECRET,
            },
            options: {
                injectSvg: true,
            },
        },
    },
});
