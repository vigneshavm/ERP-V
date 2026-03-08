import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';
import path from 'path';

export default defineConfig({
    plugins: [
        react(),
        federation({
            name: 'mfe_online_store',
            filename: 'remoteEntry.js',
            exposes: {
                './App': './src/index.ts',
            },
            shared: ['react', 'react-dom']
        }),
    ],
    build: {
        modulePreload: false,
        target: 'esnext',
        minify: false,
        cssCodeSplit: false,
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
});
