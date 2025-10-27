import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@thebcms/client': path.resolve(__dirname, '../../client/src'),
            '@thebcms/components-react': path.resolve(
                __dirname,
                '../../components/react/src',
            ),
        },
    },
});
