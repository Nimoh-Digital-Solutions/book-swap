import * as Sentry from '@sentry/react-native';
import type { ComponentType } from 'react';
import Constants from 'expo-constants';

const DSN =
  Constants.expoConfig?.extra?.sentryDsn ?? process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';

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

export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (!initialised) {
    if (__DEV__) console.error('[Sentry-stub]', error, context);
    return;
  }
  Sentry.withScope((scope) => {
    if (context) scope.setExtras(context);
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
