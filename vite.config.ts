/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    // Installable, offline PWA (production builds only; dev has no service worker).
    // registerType 'prompt' without a prompt: a new version waits until every
    // window of the app is closed, so an update never reloads mid-workout.
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'script-defer',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: './',
        name: 'Maçã Verde',
        short_name: 'Maçã Verde',
        description: 'A daily plan for body and mind: short workouts, rest, mood checks and pause drills, one day at a time.',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        // Canvas token (src/styles/tokens.css, light).
        background_color: '#f7f7f4',
        theme_color: '#f7f7f4',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  server: {
    port: 5173,
    host: true
  },
  // Vitest runs unit tests under src/ only; tests/ux is Playwright's (playwright.config.ts).
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
