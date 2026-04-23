import * as Sentry from '@sentry/react-native';
import type { ComponentType } from 'react';
import Constants from 'expo-constants';
import { env } from '@/configs/env';

const DSN =
  Constants.expoConfig?.extra?.sentryDsn ?? process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';
const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';
const UPDATE_ID = Constants.expoConfig?.extra?.eas?.updateId;

let initialised = false;

export const reactNavigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: true,
});

const SENSITIVE_PARAMS = /([?&](token|access|refresh|key|exchange_token)=)[^&]*/gi;

function scrubUrl(url: string): string {
  return url.replace(SENSITIVE_PARAMS, '$1[Filtered]');
}

export function initSentry() {
  if (initialised || !DSN) return;
  Sentry.init({
    dsn: DSN,
    environment: env.environment,
    release: `com.gnimoh.bookswap@${APP_VERSION}`,
    dist: UPDATE_ID ?? APP_VERSION,
    debug: __DEV__,
    sendDefaultPii: false,
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    integrations: [reactNavigationIntegration],
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['authorization'];
      }
      if (event.request?.url) event.request.url = scrubUrl(event.request.url);
      if (typeof event.request?.query_string === 'string') {
        event.request.query_string = scrubUrl(event.request.query_string);
      }
      if (event.breadcrumbs) {
        for (const bc of event.breadcrumbs) {
          if (bc.data?.url && typeof bc.data.url === 'string') bc.data.url = scrubUrl(bc.data.url);
        }
      }
      return event;
    },
  });
  initialised = true;
}

export function setSentryUser(id: string | null) {
  if (!initialised) return;
  Sentry.setUser(id ? { id } : null);
}

const SENSITIVE_KEYS = /token|password|secret|credential|authorization|cookie|session_id|api_key/i;

function scrubExtras(raw: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (SENSITIVE_KEYS.test(key)) {
      cleaned[key] = '[Filtered]';
    } else if (typeof value === 'string' && value.length > 512) {
      cleaned[key] = value.slice(0, 512) + '…[truncated]';
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (!initialised) {
    if (__DEV__) console.error('[Sentry-stub]', error, context);
    return;
  }
  Sentry.withScope((scope) => {
    if (context) scope.setExtras(scrubExtras(context));
    Sentry.captureException(error);
  });
}

export function addBreadcrumb(category: string, message: string, data?: Record<string, unknown>) {
  if (!initialised) return;
  Sentry.addBreadcrumb({ category, message, data, level: 'info' });
}

export function wrapRootComponent<P extends object>(Component: ComponentType<P>) {
  return Sentry.wrap(Component as ComponentType<Record<string, unknown>>);
}

export { Sentry };
