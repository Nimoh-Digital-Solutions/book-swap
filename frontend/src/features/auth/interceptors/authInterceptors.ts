import type {
  ErrorInterceptor,
  HttpRequestContext,
  RequestInterceptor,
} from '@nimoh-digital-solutions/tast-utils';
import { HttpError } from '@nimoh-digital-solutions/tast-utils';

import { getCsrfToken,useAuthStore } from '../stores/authStore';

// ---------------------------------------------------------------------------
// HTTP methods that require a CSRF token
// ---------------------------------------------------------------------------
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// ---------------------------------------------------------------------------
// Auth request interceptor
// ---------------------------------------------------------------------------

/**
 * Attaches `Authorization: Bearer <token>` to every outgoing request
 * when the user is authenticated.
 *
 * The access token is read directly from the Zustand store (outside
 * of React) so this interceptor works in both component and non-component
 * contexts.
 */
export const authRequestInterceptor: RequestInterceptor = (
  context: HttpRequestContext,
) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    context.headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return context;
};

// ---------------------------------------------------------------------------
// CSRF request interceptor
// ---------------------------------------------------------------------------

/**
 * Attaches `X-CSRFToken` header to all mutating requests (POST, PUT,
 * PATCH, DELETE). CSRF token is fetched once during app initialisation
 * and stored in module scope.
 */
export const csrfRequestInterceptor: RequestInterceptor = (
  context: HttpRequestContext,
) => {
  const token = getCsrfToken();
  if (token && MUTATING_METHODS.has(context.method.toUpperCase())) {
    context.headers['X-CSRFToken'] = token;
  }
  return context;
};

// ---------------------------------------------------------------------------
// 401 error interceptor (token refresh + retry)
// ---------------------------------------------------------------------------

/** Default timeout for the retry request (30 s, matching HttpClient default). */
const RETRY_TIMEOUT_MS = 30_000;

/**
 * When a request fails with 401:
 * 1. Attempt a silent token refresh.
 * 2. If refresh succeeds, retry the original request once with the new token.
 * 3. If refresh fails, clear auth state (redirect handled by the store / UI).
 *
 * The retry manually re-applies auth + CSRF headers and credentials so that
 * it mirrors the full interceptor chain without re-entering it (which would
 * cause infinite loops on persistent 401s).
 */
export const authErrorInterceptor: ErrorInterceptor = async (
  error: unknown,
  context: HttpRequestContext,
) => {
  if (!(error instanceof HttpError) || error.status !== 401) {
    throw error;
  }

  // Don't try to refresh if the failing request was itself the refresh endpoint
  if (context.url.includes('/token/refresh/')) {
    useAuthStore.getState().clearAuth();
    throw error;
  }

  const refreshed = await useAuthStore.getState().refreshToken();

  if (!refreshed) {
    throw error;
  }

  // Retry the original request with the fresh access token + CSRF
  const freshToken = useAuthStore.getState().accessToken;
  const retryHeaders = { ...context.headers };
  if (freshToken) {
    retryHeaders['Authorization'] = `Bearer ${freshToken}`;
  }

  // Re-apply CSRF header for mutating methods
  const csrf = getCsrfToken();
  if (csrf && MUTATING_METHODS.has(context.method.toUpperCase())) {
    retryHeaders['X-CSRFToken'] = csrf;
  }

  const retryResponse = await fetch(context.url, {
    method: context.method,
    headers: retryHeaders,
    ...(context.body != null ? { body: JSON.stringify(context.body) } : {}),
    credentials: context.credentials ?? 'include',
    signal: AbortSignal.timeout(RETRY_TIMEOUT_MS),
  });

  return retryResponse;
};
