import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';
import path from 'path';

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    react(),
    federation({
      name: 'mfe_auth',
      filename: 'remoteEntry.js',
      exposes: {
        './AuthStore': './src/store/authStore.ts',
        './AuthApi': './src/api/authApi.ts',
        './useAuth': './src/hooks/useAuth.ts',
        './LoginPage': './src/pages/LoginPage.tsx',
        './LoginForm': './src/components/LoginForm.tsx',
      },
      shared: ['react', 'react-dom', 'zustand', '@tanstack/react-query']
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
