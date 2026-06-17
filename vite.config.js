import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// DareDrop – Vite config
// Das PWA-Plugin generiert den Service Worker und das Manifest.
// FCM-Push läuft über einen eigenen Service Worker (firebase-messaging-sw.js),
// der separat in /public liegt und vom Browser zusätzlich registriert wird,
// sobald in Firebase Cloud Messaging eingerichtet ist (siehe README).
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'DareDrop',
        short_name: 'DareDrop',
        description: 'Accept the dare. Or take the drink.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        // Firebase Messaging SW läuft separat, also hier ausschließen
        navigateFallbackDenylist: [/^\/firebase-messaging-sw\.js$/]
      }
    })
  ],
  server: {
    host: true,
    port: 5173
  }
})
