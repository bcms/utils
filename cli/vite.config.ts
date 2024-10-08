import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
    resolve: {
        alias: {
            '@thebcms/cli': fileURLToPath(new URL('./src', import.meta.url)),
            '@thebcms/client': fileURLToPath(
                new URL('../client/src', import.meta.url),
            ),
        },
    },
});
