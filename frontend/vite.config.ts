import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      strictPort: false,
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

        // Explicit aliases for React and its subpaths are still useful for consistency
        'react': path.resolve(__dirname, 'node_modules/react'),
        'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react/jsx-runtime.js'),
        'react/jsx-dev-runtime': path.resolve(__dirname, 'node_modules/react/jsx-dev-runtime.js'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
        'react-router-dom': path.resolve(__dirname, 'node_modules/react-router-dom'),

        // Explicit aliases for other critical shared dependencies
        'bcryptjs': path.resolve(__dirname, 'node_modules/bcryptjs'),
        '@reduxjs/toolkit': path.resolve(__dirname, 'node_modules/@reduxjs/toolkit'),
        'react-redux': path.resolve(__dirname, 'node_modules/react-redux'),
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
