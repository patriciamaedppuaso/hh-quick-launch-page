import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'H&H Quick Launch',
        short_name: 'Quick Launch',
        description: "Internal dashboard for H&H Medical Supply -- tasks, leads, contacts, time clock, and more.",
        theme_color: '#327e88',
        background_color: '#ecf1f0',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // This app is 100% live Supabase data -- there's no meaningful
        // offline mode to build, so just precache the app shell (JS/CSS/
        // HTML) for fast repeat loads and installability, nothing more.
        globPatterns: ['**/*.{js,css,html,svg,png}'],
      },
    }),
  ],
})
