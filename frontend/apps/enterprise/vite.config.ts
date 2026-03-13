import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    base: '/enterprise/',
    server: {
      port: 3004,
      host: '0.0.0.0',
      strictPort: false,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
    // Keep optimizeDeps to ensure dependencies used in root src are pre-bundled
    optimizeDeps: {
      include: [
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        '@reduxjs/toolkit',
        'react-redux',
        'bcryptjs',
        'crypto-js',
        'lucide-react',
        'recharts',
        'framer-motion'
      ]
    },
    plugins: [
      react(),
      tailwindcss(),
      federation({
        name: 'enterprise_host',
        remotes: {
          mfe_budget_planner: 'http://localhost:5001/assets/remoteEntry.js',
          mfe_online_store: 'http://localhost:5002/assets/remoteEntry.js',
        },
        shared: ['react', 'react-dom', 'react-redux']
      }),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024  // 5 MB
        },
        manifest: {
          name: 'Enterprise ERP',
          short_name: 'ERP',
          description: 'Enterprise Resource Planning System',
          theme_color: '#ffffff',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      }),
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@root': path.resolve(__dirname, '..'),
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-viz': ['recharts', 'framer-motion'],
            'vendor-ui': ['lucide-react'],
            'vendor-data': ['@reduxjs/toolkit', 'react-redux'],
          }
        }
      }
    }
  };
});
