import { z } from 'zod';

/**
 * env — validated environment variables
 *
 * All VITE_* variables consumed by the app are declared here.
 * Zod validates shape and format on app startup. If a value is present but
 * malformed (e.g. VITE_API_URL is not a valid URL), a ZodError is thrown with
 * a clear message before any network call is made.
 *
 * Required vs optional:
 *   - VITE_API_URL   — optional (apps with no backend omit it at dev time);
 *                       when present it must be a valid URL.
 *   - VITE_APP_TITLE — optional; falls back to 'React Starter Kit' in APP_CONFIG.
 *   - VITE_PWA       — optional; only meaningful when the PWA feature is installed.
 *
 * To add a new variable:
 *   1. Add it to envSchema below.
 *   2. Export it from APP_CONFIG in appConfig.ts (or consume env directly).
 *   3. Document it in .env.example.
 */
const envSchema = z.object({
  /** Base URL for all API requests. Must be a valid absolute URL when provided. */
  VITE_API_URL: z
    .string()
    .url('VITE_API_URL must be a valid URL (e.g. https://api.example.com)')
    .optional(),

  /** Application display name used in page titles and PWA manifest. */
  VITE_APP_TITLE: z.string().optional(),

  /**
   * Set to "true" to enable the PWA service worker in dev mode.
   * Has no effect when the PWA feature is not installed.
   */
  VITE_PWA: z.enum(['true', 'false']).optional(),

  /**
   * Sentry DSN for error tracking and performance monitoring.
   * When omitted, Sentry is disabled (safe for local dev).
   */
  VITE_SENTRY_DSN: z
    .string()
    .transform(v => (v === '' ? undefined : v))
    .pipe(z.string().url('VITE_SENTRY_DSN must be a valid Sentry DSN URL').optional())
    .optional(),

  /**
   * Sentry environment tag (e.g. "production", "staging", "development").
   * Defaults to "development" when omitted.
   */
  VITE_SENTRY_ENVIRONMENT: z.string().optional(),

  /**
   * WebSocket base URL for real-time features.
   * When omitted, derived automatically from VITE_API_URL (http→ws, https→wss).
   * Note: Zod's .url() rejects ws:// and wss:// schemes — use .refine() instead.
   */
  VITE_WS_URL: z
    .string()
    .refine(
      val => /^wss?:\/\/.+/.test(val),
      { message: 'VITE_WS_URL must be a valid WebSocket URL (ws:// or wss://)' },
    )
    .optional(),

  // -- Feature flags --------------------------------------------------------
  // Add project-specific feature flags here. Use the naming convention
  // VITE_FF_<FEATURE_NAME> with 'true' / 'false' string values.
  //
  // Example:
  //   VITE_FF_DARK_MODE: z.enum(['true', 'false']).optional(),
});

// Parse once at module load time. Parse errors surface immediately in the
// browser console (dev) or Vite's build output (production), before any
// component tries to use APP_CONFIG.
const _result = envSchema.safeParse(import.meta.env);

if (!_result.success) {
  const messages = _result.error.issues
    .map(issue => `  • ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');

  // Throw instead of console.warn so invalid config is impossible to miss in
  // CI builds and crashes fast in production before any data is fetched.
  throw new Error(`[env] Invalid environment variables:\n${messages}\nCheck your .env.local file.`);
}

export const env = _result.data;
