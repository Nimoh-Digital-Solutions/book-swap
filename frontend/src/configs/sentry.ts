import * as Sentry from '@sentry/react';

import { env } from './env';

/**
 * initSentry — initialise Sentry error tracking and performance monitoring.
 *
 * Called once in `main.tsx` before `createRoot()`. When `VITE_SENTRY_DSN`
 * is not set (local dev), this is a no-op — the SDK's `enabled` flag is
 * set to `false` so no network requests leave the browser.
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/react/
 */
export function initSentry(): void {
  const dsn = env.VITE_SENTRY_DSN;

  Sentry.init({
    dsn: dsn ?? '',
    enabled: Boolean(dsn),
    environment: env.VITE_SENTRY_ENVIRONMENT ?? 'development',

    // Performance monitoring — keep sample rate low in production to
    // avoid exceeding Sentry quotas. Override via VITE_SENTRY_TRACES_RATE
    // if needed in the future.
    tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,

    // Session replay — disabled by default, uncomment to enable.
    // replaysSessionSampleRate: 0.1,
    // replaysOnErrorSampleRate: 1.0,

    // Only send events for our own code, not third-party scripts
    allowUrls: [window.location.origin],

    // Ignore common browser extension noise and ResizeObserver errors
    ignoreErrors: [
      // Browser extensions
      /extensions\//i,
      /^chrome-extension:\/\//,
      // ResizeObserver errors are generally benign
      'ResizeObserver loop',
      'ResizeObserver loop completed with undelivered notifications',
    ],

    integrations: [
      Sentry.browserTracingIntegration(),
      // Mask all text and block media by default to prevent PII leakage.
      // Set to false in dev/staging if you need to debug visually.
      Sentry.replayIntegration({
        maskAllText: import.meta.env.PROD,
        blockAllMedia: import.meta.env.PROD,
      }),
    ],

    // Strip PII from breadcrumbs
    beforeBreadcrumb(breadcrumb) {
      // Remove fetch/xhr body data to avoid leaking tokens/PII
      if (breadcrumb.category === 'fetch' || breadcrumb.category === 'xhr') {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete breadcrumb.data?.['request_body'];
      }
      return breadcrumb;
    },
  });
}

/**
 * Set the Sentry user context — call after successful login.
 * Pass `null` to clear (on logout).
 */
export function setSentryUser(user: { id: string; email?: string } | null): void {
  Sentry.setUser(user);
}

/**
 * Capture an exception manually (for non-React errors).
 */
export function captureException(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  if (context) {
    Sentry.captureException(error, { extra: context });
  } else {
    Sentry.captureException(error);
  }
}

/**
 * Add a breadcrumb for richer error context.
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>,
): void {
  const breadcrumb: Sentry.Breadcrumb = { message, category, level: 'info' };
  if (data) {
    breadcrumb.data = data;
  }
  Sentry.addBreadcrumb(breadcrumb);
}

// Re-export the ErrorBoundary wrapper from Sentry for convenience
export { Sentry };
