import { env } from './env';

/**
 * APP_CONFIG
 *
 * Typed, validated application configuration sourced from environment variables.
 * All values flow through the Zod schema in env.ts — if a variable is present but
 * malformed, the app throws at startup before any network call is made.
 *
 * Add new env vars to env.ts first, then surface them here.
 */

/**
 * Converts an http(s) API URL to a ws(s) WebSocket URL.
 * Returns '' if the input is not a valid URL.
 *
 * Example: deriveWsUrl('https://api.example.com') → 'wss://api.example.com'
 */
function deriveWsUrl(apiUrl: string): string {
  try {
    const url = new URL(apiUrl);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return url.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
}

export const APP_CONFIG = {
  /** Base URL for API requests (validated as a URL in env.ts when present). */
  apiUrl: env.VITE_API_URL ?? '',

  /** Application display name — used in page titles, metadata, and PWA manifest. */
  appName: env.VITE_APP_TITLE ?? 'Bookswap',

  /**
   * WebSocket base URL.
   * Explicit VITE_WS_URL takes precedence; otherwise derived from VITE_API_URL
   * by swapping http→ws / https→wss. Falls back to '' when neither is set.
   */
  wsUrl: env.VITE_WS_URL ?? (env.VITE_API_URL ? deriveWsUrl(env.VITE_API_URL) : ''),

  /**
   * Feature flags (default off).
   * Add project-specific flags here, sourced from env.ts.
   *
   * Example:
   *   darkMode: env.VITE_FF_DARK_MODE === 'true',
   */
  features: {} as Record<string, boolean>,
};
