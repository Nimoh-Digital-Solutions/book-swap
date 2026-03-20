import type { Metric } from 'web-vitals';

import { logger } from './logger';

/**
 * Web Vitals monitoring — tracks Core Web Vitals (CLS, FID, LCP, TTFB, INP)
 * and reports them to a pluggable handler.
 *
 * In development: logs to the console.
 * In production: sends to Sentry performance monitoring (when enabled).
 *
 * Call `initWebVitals()` once in your entry point after the app mounts.
 *
 * @see https://web.dev/articles/vitals
 * @see https://github.com/GoogleChrome/web-vitals
 */

// ---------------------------------------------------------------------------
// Reporter abstraction
// ---------------------------------------------------------------------------

/** Signature for a web-vitals metric reporter. */
export type MetricReporter = (metric: Metric) => void;

/**
 * Default dev reporter — logs each metric to the console in a
 * human-readable format with colour-coded rating.
 */
const consoleReporter: MetricReporter = (metric) => {
  logger.info(`[web-vitals] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`, {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
  });
};

/**
 * Sentry reporter — sends metrics as custom measurements attached to
 * the current transaction / span. Only active when Sentry is initialised.
 */
const sentryReporter: MetricReporter = (metric) => {
  void import('@configs/sentry').then(({ Sentry }) => {
    // Use Sentry.metrics API if available, otherwise fall back to
    // setting a measurement on the active span.
    const activeSpan = Sentry.getActiveSpan();
    if (activeSpan) {
      // Sentry.metrics may vary by SDK version; measurement is universally supported
      activeSpan.setAttribute(`web_vital.${metric.name}`, metric.value);
    }
  });
};

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

/**
 * initWebVitals — lazily imports web-vitals and starts metric collection.
 *
 * @param reporter - Custom reporter function. Defaults to console (dev) or
 *                   Sentry (prod).
 *
 * @example
 * // In main.tsx after createRoot().render()
 * initWebVitals();
 *
 * // Or with a custom reporter
 * initWebVitals((metric) => analytics.track('web-vital', metric));
 */
export function initWebVitals(reporter?: MetricReporter): void {
  const report = reporter ?? (import.meta.env.PROD ? sentryReporter : consoleReporter);

  // Dynamic import keeps web-vitals out of the critical chunk
  // web-vitals v5 removed onFID — FID is superseded by INP.
  void import('web-vitals').then(({ onCLS, onLCP, onTTFB, onINP }) => {
    onCLS(report);
    onLCP(report);
    onTTFB(report);
    onINP(report);
  });
}
