/**
 * PWA Type Definitions
 *
 * Canonical home for all PWA-related types.
 * Import from here (or @types) rather than from @utils/pwa.
 */

// ---------------------------------------------------------------------------
// Primitive types — also used by src/utils/pwa.ts
// ---------------------------------------------------------------------------
export type DisplayMode = 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
export type ConnectionType = 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';

export type BeforeInstallPromptEventLike = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export interface PWAUpdatePromptProps {
  onUpdate: () => void;
  onDismiss: () => void;
}

export interface PWAManifest {
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  scope: string;
  display: DisplayMode;
  orientation:
    | 'portrait-primary'
    | 'portrait-secondary'
    | 'landscape-primary'
    | 'landscape-secondary';
  background_color: string;
  theme_color: string;
  categories: string[];
  icons: PWAIcon[];
}

export interface PWAIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: 'any' | 'maskable' | 'monochrome';
}

export interface PWAConfig {
  strategies: 'generateSW' | 'injectManifest';
  registerType: 'autoUpdate' | 'prompt' | 'skipWaiting';
  manifest: boolean | PWAManifest;
  includeAssets: string[];
  workbox: WorkboxConfig;
  devOptions: DevOptions;
}

export interface WorkboxConfig {
  navigateFallback: string;
  runtimeCaching: RuntimeCache[];
  cleanupOutdatedCaches: boolean;
  skipWaiting: boolean;
  clientsClaim: boolean;
}

export interface RuntimeCache {
  urlPattern: string | RegExp | ((options: { request: Request }) => boolean);
  handler: 'CacheFirst' | 'NetworkFirst' | 'StaleWhileRevalidate' | 'NetworkOnly' | 'CacheOnly';
  options: CacheOptions;
}

export interface CacheOptions {
  cacheName: string;
  expiration?: {
    maxEntries: number;
    maxAgeSeconds: number;
  };
  networkTimeoutSeconds?: number;
}

export interface DevOptions {
  enabled: boolean;
  type?: 'module' | 'classic';
}
