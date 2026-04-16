import { VitePWA } from 'vite-plugin-pwa';

/**
 * PWA Plugin Configuration
 *
 * Strategy:
 * - Production: enabled (generateSW) with precaching + runtime caching
 * - Development: opt-in via enableDev (prevents stale-cache confusion for daily dev)
 *
 * Note:
 * - manifest: false means the manifest is provided via /public (e.g. /public/manifest.webmanifest).
 */
export function pwaPlugin({ isProd, enableDev }: { isProd: boolean; enableDev: boolean }) {
  return VitePWA({
    // Service Worker Strategy
    strategies: 'generateSW',
    registerType: 'autoUpdate',

    // We ship our own manifest in /public
    manifest: false,

    // Additional static assets to include
    includeAssets: ['favicon.ico', 'og-image.png', 'icons/*.png'],

    workbox: {
      // SPA navigation fallback (React Router)
      navigateFallback: '/index.html',

      // Only precache via glob patterns in production
      ...(isProd && {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,webmanifest}'],
      }),

      // Runtime caching strategies
      runtimeCaching: [
        // Images
        {
          urlPattern: ({ request }) => request.destination === 'image',
          handler: 'CacheFirst',
          options: {
            cacheName: 'images',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
            },
          },
        },
        // Google Fonts caching
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
            },
          },
        },
        // Google Fonts static files
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'gstatic-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
            },
          },
        },
        // API caching (example: any https://api.* domain)
        // If you use a specific API host, prefer listing it explicitly.
        {
          urlPattern: /^https:\/\/api\./i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 5, // 5 minutes
            },
            networkTimeoutSeconds: 3,
          },
        },
      ],

      // Clean up old caches
      cleanupOutdatedCaches: true,

      // Immediate activation/update behaviour
      skipWaiting: true,
      clientsClaim: true,
    },

    // Dev service worker behaviour (opt-in)
    devOptions: {
      enabled: enableDev,
      type: 'module',
    },
  });
}
