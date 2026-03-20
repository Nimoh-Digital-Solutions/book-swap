import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { captureException,initSentry } from '@configs/sentry';
import { logger } from '@utils/logger';

// open-props custom properties are injected at build time by postcss-jit-props
// (see vite.config.ts → css.postcss). Only the vars actually used in CSS/SCSS
// end up in the bundle — no manual import needed here.
import App from './App';
import { initPWA } from './sw/pwa';

import '@styles/tailwind.css';
// ---------------------------------------------------------------------------
// Sentry — initialise before anything else so early errors are captured
// ---------------------------------------------------------------------------
initSentry();

initPWA();

// Get the root HTML container — throw early to surface misconfigured deploys
const container = document.getElementById('root');
if (!container) {
  throw new Error('[main] #root element not found — check index.html');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// ---------------------------------------------------------------------------
// Global unhandled rejection handler
// Catches promise rejections that escape all try/catch and .catch() handlers.
// Reports to Sentry and logs to console in development.
// ---------------------------------------------------------------------------
window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason instanceof Error
    ? event.reason
    : new Error(String(event.reason));

  captureException(error, { source: 'unhandledrejection' });

  if (import.meta.env.DEV) {
    logger.error('[unhandledrejection]', { error });
  }
});

// ---------------------------------------------------------------------------
// @axe-core/react — development-only accessibility audit
// Reports WCAG violations to the browser console as they occur.
// Removed from production bundles by Vite's dead-code elimination because
// the condition is always false when import.meta.env.DEV is false.
// ---------------------------------------------------------------------------
if (import.meta.env.DEV) {
  void Promise.all([import('@axe-core/react'), import('react-dom')]).then(
    ([{ default: axe }, ReactDOM]) => {
      void axe(React, ReactDOM, 1000);
    },
  );
}

// ---------------------------------------------------------------------------
// Web Vitals — Core Web Vitals monitoring (CLS, FID, LCP, TTFB, INP)
// Reports to console in dev, Sentry performance in production.
// ---------------------------------------------------------------------------
void import('./utils/web-vitals').then(({ initWebVitals }) => {
  initWebVitals();
});
