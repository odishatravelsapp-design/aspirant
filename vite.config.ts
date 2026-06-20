import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// For GitHub Pages PROJECT sites the app is served from /<repo>/.
// Set BASE_PATH at build time, e.g. BASE_PATH=/aspirant/ npm run build
// For a user/custom domain or local dev, '/' is correct.
const base = process.env.BASE_PATH || '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  build: {
    rollupOptions: {
      output: {
        // Keep the optional Supabase client in its own predictably-named chunk so
        // it can be excluded from the offline precache (only fetched if cloud is on).
        manualChunks(id) {
          if (id.includes('@supabase')) return 'supabase'
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      // Cache the question JSON so the app works fully offline.
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json}'],
        // Don't precache the heavy optional cloud chunk; it loads on demand.
        globIgnores: ['**/supabase-*.js'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/data/'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'aspirant-questions',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      manifest: {
        name: 'Aspirant — Free Exam Prep',
        short_name: 'Aspirant',
        description: 'Free, offline exam prep for banking and Odisha state exams.',
        theme_color: '#2563eb',
        background_color: '#f1f5f9',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
