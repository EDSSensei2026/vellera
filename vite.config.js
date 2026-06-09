import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path'; // Crucial node built-in utility

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Vellera Tactical Performance',
        short_name: 'Vellera',
        description: 'Tactical fitness and combat readiness training tracker.',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      // Maps the absolute workspace directory to the "@" prefix for Rollup
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) {
            return 'vendor-3d-engine';
          }
          if (id.includes('node_modules/leaflet') || id.includes('node_modules/recharts')) {
            return 'vendor-maps-charts';
          }
          if (id.includes('node_modules/@radix-ui') || id.includes('node_modules/@tanstack')) {
            return 'vendor-ui-core';
          }
        }
      }
    }
  }
});