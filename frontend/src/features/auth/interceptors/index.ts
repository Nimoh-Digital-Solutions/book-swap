/**
 * initAuthInterceptors
 *
 * Registers the auth and CSRF interceptors on the shared HTTP client.
 * Called once during app initialisation (from `useInitAuth`) — see App.tsx.
 *
 * Interceptors are added at runtime (not in the `http` module's config)
 * to avoid a circular dependency: http ← auth store ← http.
 *
 * The notification error interceptor is registered LAST so that the auth
 * interceptor has a chance to recover 401 errors before the notification
 * bridge fires.
 */
import { http } from '@services';
import { notificationErrorInterceptor } from '@services/errorHandlers';

import {
  authErrorInterceptor,
  authRequestInterceptor,
  csrfRequestInterceptor,
} from './authInterceptors';

let initialised = false;

export function initAuthInterceptors(): void {
  if (initialised) return;
  initialised = true;

  http.addRequestInterceptor(authRequestInterceptor);
  http.addRequestInterceptor(csrfRequestInterceptor);
  http.addErrorInterceptor(authErrorInterceptor);
  // Must come AFTER auth error interceptor — auto-shows toasts for unrecovered errors
  http.addErrorInterceptor(notificationErrorInterceptor);
}
