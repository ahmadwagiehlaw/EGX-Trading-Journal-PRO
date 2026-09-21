import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false, // We already have a static manifest in public/manifest.json
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg}']
      }
    })
  ],
})
