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
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
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
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,  // 5 MB
          // Only precache the app shell. Precaching all ~200 lazy route chunks (~6 MB) made
          // every first visit download the whole app in the background and compete with the
          // page's own requests. Route chunks are cached on first use instead (see below).
          globPatterns: [
            'index.html',
            'assets/index-*.{js,css}',
            'assets/vendor-*.js',
            '*.{ico,png,svg,webmanifest}',
          ],
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              // Content-hashed, immutable lazy chunks
              urlPattern: ({ url }) => url.pathname.startsWith('/assets/'),
              handler: 'CacheFirst',
              options: {
                cacheName: 'erp-assets',
                expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'erp-fonts' },
            },
          ],
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
            // 'vendor-viz' (recharts + framer-motion, ~540 KB) intentionally NOT forced into a
            // manual chunk: as one it was modulepreloaded on every page load, including login.
            // Left to Rollup, it is only fetched with the dashboard/report routes that use it.
            'vendor-ui': ['lucide-react'],
            'vendor-data': ['@reduxjs/toolkit', 'react-redux'],
          }
        }
      }
    }
  };
});
