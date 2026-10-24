import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'node:url';
import { BRAND } from '../packages/shared/src/brand';

const PREVIEW = process.env.VITE_PREVIEW === '1';

export default defineConfig({
  // Prévia sem servidor: caminhos relativos e nomes de arquivo fixos (publicada como página única).
  base: PREVIEW ? './' : '/',
  build: PREVIEW
    ? {
        outDir: 'dist-preview',
        rollupOptions: { output: { entryFileNames: 'assets/app.js', chunkFileNames: 'assets/[name].js', assetFileNames: 'assets/[name][extname]' } },
      }
    : undefined,
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3001' },
  },
  plugins: [
    react(),
    !PREVIEW && VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: BRAND.name,
        short_name: BRAND.shortName,
        description: BRAND.description,
        lang: 'pt-BR',
        start_url: '/',
        display: 'standalone',
        background_color: '#F6F8FB',
        theme_color: BRAND.themeColor,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // Estados, municípios e categorias mudam pouco: cache primeiro.
            urlPattern: ({ url }) => url.pathname.startsWith('/api/locations') || url.pathname === '/api/categories',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'reference-data', expiration: { maxEntries: 60, maxAgeSeconds: 7 * 86400 } },
          },
        ],
      },
    }),
  ],
});
