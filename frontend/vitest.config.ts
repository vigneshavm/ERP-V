import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
            'react': path.resolve(__dirname, 'node_modules/react'),
            'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
            'react-router-dom': path.resolve(__dirname, 'node_modules/react-router-dom'),
            '@reduxjs/toolkit': path.resolve(__dirname, 'node_modules/@reduxjs/toolkit'),
            'react-redux': path.resolve(__dirname, 'node_modules/react-redux'),
        },
    },
    test: {
        environment: 'jsdom',
        setupFiles: ['./src/setupTests.ts'],
        globals: true,
        exclude: ['**/node_modules/**', '**/e2e/**'],
        // These are hoisted to the repo-root node_modules, where plain Node resolution can't find
        // frontend's react; inlining them makes the react aliases above apply to them too.
        server: { deps: { inline: ['react-hook-form', '@hookform/resolvers'] } },
    },
});
