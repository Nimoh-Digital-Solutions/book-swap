// Types now live in src/types/pwa.ts — re-export for backward compatibility
// Using relative path: '@types/*' conflicts with TypeScript's reserved @types/ namespace
export type { BeforeInstallPromptEventLike,ConnectionType, DisplayMode } from '../types/pwa';
import type { BeforeInstallPromptEventLike,ConnectionType, DisplayMode } from '../types/pwa';
import { pwaState } from './_pwa-state';
import { logger } from './logger';

// ---------------------------------------------------------------------------
// Typed navigator extension — replaces (navigator as any) casts
// ---------------------------------------------------------------------------
interface NavigatorExtended extends Navigator {
  /** iOS Safari standalone mode flag */
  standalone?: boolean;
  /** Non-standard touch-point count (used for iPadOS detection) */
  maxTouchPoints: number;
  /** Network Information API (not universally supported) */
  connection?: { effectiveType: ConnectionType };
}

/**
 * Register a listener that captures the `beforeinstallprompt` event.
 * Call once on app startup (e.g. in App.tsx).
 *
 * This is the most reliable way to know whether install is possible.
 */
export function registerPWAInstallPromptListener(): void {
  if (pwaState.listenersRegistered) return;
  pwaState.listenersRegistered = true;

  window.addEventListener('beforeinstallprompt', (event: Event) => {
    // Chrome/Edge fires this; prevent default so you can show your own UI.
    event.preventDefault?.();

    pwaState.deferredInstallPrompt = event as BeforeInstallPromptEventLike;
  });
}

/**
 * Returns true if the browser has fired `beforeinstallprompt` and we captured it.
 */
export function canPromptPWAInstall(): boolean {
  return pwaState.deferredInstallPrompt !== null;
}

/**
 * Trigger the installation prompt (if available).
 * Returns:
 * - 'accepted' / 'dismissed' if prompt was shown
 * - null if prompting isn't available
 */
export async function promptPWAInstall(): Promise<'accepted' | 'dismissed' | null> {
  if (!pwaState.deferredInstallPrompt) return null;

  try {
    await pwaState.deferredInstallPrompt.prompt();
    const choice = await pwaState.deferredInstallPrompt.userChoice;

    // After prompting, browsers generally won't allow reusing the same event.
    pwaState.deferredInstallPrompt = null;

    return choice?.outcome ?? null;
  } catch (error) {
    logger.warn('Failed to prompt PWA install', { error });
    pwaState.deferredInstallPrompt = null;
    return null;
  }
}

/**
 * Check if the app is running in an installed/standalone display mode.
 * Supports both standard display-mode and iOS navigator.standalone.
 */
export function isPWA(): boolean {
  const standalone = window.matchMedia?.('(display-mode: standalone)')?.matches ?? false;

  // iOS Safari uses navigator.standalone when launched from home screen
  const iosStandalone = (navigator as NavigatorExtended).standalone === true;

  return standalone || iosStandalone;
}

/**
 * Get the current display mode.
 */
export function getDisplayMode(): DisplayMode {
  if (window.matchMedia?.('(display-mode: standalone)')?.matches) return 'standalone';
  if (window.matchMedia?.('(display-mode: fullscreen)')?.matches) return 'fullscreen';
  if (window.matchMedia?.('(display-mode: minimal-ui)')?.matches) return 'minimal-ui';
  return 'browser';
}

/**
 * iOS detection (including iPadOS which often reports as Macintosh).
 */
export function isIOS(): boolean {
  const ua = navigator.userAgent || '';
  const isIPhoneIPadIPod = /iPad|iPhone|iPod/.test(ua);

  // iPadOS 13+ can report "Macintosh" but has touch points
  const isIPadOS = /Macintosh/.test(ua) && (navigator as NavigatorExtended).maxTouchPoints > 1;

  return isIPhoneIPadIPod || isIPadOS;
}

export function isAndroid(): boolean {
  return /Android/.test(navigator.userAgent || '');
}

export function supportsServiceWorker(): boolean {
  return typeof navigator.serviceWorker?.getRegistration === 'function';
}

/**
 * Network Information API (not supported everywhere).
 */
export function getConnectionType(): ConnectionType {
  const type = (navigator as NavigatorExtended)?.connection?.effectiveType;
  return type ?? 'unknown';
}

export function isSlowConnection(): boolean {
  const t = getConnectionType();
  return t === 'slow-2g' || t === '2g';
}

/**
 * Optional: Get an app version via SW messaging.
 * Requires the service worker to implement message handling.
 *
 * If you don't implement SW messaging, keep this returning null.
 */
export async function getAppVersionFromSW(timeoutMs = 1500): Promise<string | null> {
  if (!supportsServiceWorker()) return null;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const sw = registration?.active;
    if (!sw) return null;

    // If MessageChannel isn't available, bail out.
    if (typeof MessageChannel === 'undefined') return null;

    return await new Promise<string | null>(resolve => {
      const channel = new MessageChannel();
      const timer = window.setTimeout(() => resolve(null), timeoutMs);

      channel.port1.onmessage = event => {
        window.clearTimeout(timer);
        resolve(typeof event.data === 'string' ? event.data : null);
      };

      // Your SW would respond with a version string.
      sw.postMessage({ type: 'GET_VERSION' }, [channel.port2]);
    });
  } catch (error) {
    logger.warn('Failed to get app version from service worker', { error });
    return null;
  }
}
