import { useAppStore } from '@data/useAppStore';
import type { ErrorInterceptor, HttpRequestContext, RequestInterceptor } from '@nimoh-digital-solutions/tast-utils';
import { HttpError } from '@nimoh-digital-solutions/tast-utils';

import type { FieldError } from './apiErrors';
import {
  getDrfDetailMessage,
  getErrorMessage,
  mapProblemToFieldErrors,
  parseDrfFieldErrors,
  parseProblemDetail,
} from './apiErrors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Result returned by status-specific handlers so the caller can decide
 * whether to show a toast and/or map field-level errors.
 */
export interface ErrorHandlerResult {
  /** Human-readable message suitable for a toast notification. */
  message: string;
  /** Notification variant. */
  variant: 'error' | 'warning' | 'info';
  /** If true, the bridge should NOT auto-show a toast (e.g. field errors are handled by the form). */
  suppressToast: boolean;
  /** Field-level validation errors for React Hook Form integration. */
  fieldErrors: FieldError[];
}

// ---------------------------------------------------------------------------
// Status-specific handler map
// ---------------------------------------------------------------------------

/** Handlers keyed by HTTP status code. Receives the HttpError and returns a result. */
type StatusHandler = (error: HttpError) => ErrorHandlerResult;

const statusHandlers: Record<number, StatusHandler> = {
  // 400 — Bad Request / Validation errors
  400: (error) => {
    // 1. Try RFC 7807 ProblemDetail (nimoh_base custom exception handler)
    const problem = parseProblemDetail(error);
    if (problem) {
      const fieldErrors = mapProblemToFieldErrors(problem);
      if (fieldErrors.length > 0) {
        return {
          message: getErrorMessage(problem, 'Please correct the errors below'),
          variant: 'error',
          suppressToast: true,
          fieldErrors,
        };
      }
      return {
        message: getErrorMessage(problem, 'Invalid request'),
        variant: 'error',
        suppressToast: false,
        fieldErrors: [],
      };
    }

    // 2. Try standard DRF field-level errors: { field: ["error"] }
    const drfFieldErrors = parseDrfFieldErrors(error);
    if (drfFieldErrors.length > 0) {
      return {
        message: 'Please correct the errors below',
        variant: 'error',
        suppressToast: true,
        fieldErrors: drfFieldErrors,
      };
    }

    // 3. Try DRF detail message: { detail: "string" }
    const drfDetail = getDrfDetailMessage(error);
    return {
      message: drfDetail ?? 'Invalid request',
      variant: 'error',
      suppressToast: false,
      fieldErrors: [],
    };
  },

  // 401 — Unauthorized (handled by auth interceptor, but included for completeness)
  401: () => ({
    message: 'Your session has expired. Please sign in again.',
    variant: 'warning',
    suppressToast: false,
    fieldErrors: [],
  }),

  // 402 — Payment Required (subscription gate)
  402: (error) => {
    const drfDetail = getDrfDetailMessage(error);
    return {
      message: drfDetail ?? 'This feature requires an active subscription. Please upgrade your plan.',
      variant: 'info',
      suppressToast: false,
      fieldErrors: [],
    };
  },

  // 403 — Forbidden
  403: (error) => {
    const problem = parseProblemDetail(error);
    const drfDetail = getDrfDetailMessage(error);
    return {
      message: problem
        ? getErrorMessage(problem, 'You do not have permission to perform this action')
        : drfDetail ?? 'You do not have permission to perform this action',
      variant: 'error',
      suppressToast: false,
      fieldErrors: [],
    };
  },

  // 404 — Not Found
  404: (error) => {
    const problem = parseProblemDetail(error);
    const drfDetail = getDrfDetailMessage(error);
    return {
      message: problem
        ? getErrorMessage(problem, 'The requested resource was not found')
        : drfDetail ?? 'The requested resource was not found',
      variant: 'warning',
      suppressToast: false,
      fieldErrors: [],
    };
  },

  // 423 — Locked (account lockout from rate-limited login attempts)
  423: (error) => {
    const problem = parseProblemDetail(error);
    const problemDetail =
      typeof problem?.detail === 'string' ? problem.detail : '';
    const drfDetail = getDrfDetailMessage(error);
    return {
      message: problemDetail || drfDetail || 'Your account has been temporarily locked. Please try again later.',
      variant: 'warning',
      suppressToast: false,
      fieldErrors: [],
    };
  },

  // 429 — Too Many Requests (rate limit)
  429: (error) => {
    const problem = parseProblemDetail(error);
    const problemDetail =
      typeof problem?.detail === 'string' ? problem.detail : '';
    const drfDetail = getDrfDetailMessage(error);
    return {
      message: problemDetail || drfDetail || 'Too many requests. Please wait a moment and try again.',
      variant: 'warning',
      suppressToast: false,
      fieldErrors: [],
    };
  },
};

/**
 * handleHttpError — routes an HttpError to the appropriate status handler.
 *
 * Returns a structured result so callers can:
 * - Auto-show a toast for generic errors
 * - Suppress the toast and map field errors to a form
 * - Report to Sentry for 5xx errors
 */
export function handleHttpError(error: HttpError): ErrorHandlerResult {
  const handler = statusHandlers[error.status];
  if (handler) return handler(error);

  // 5xx — server errors
  if (error.status >= 500) {
    const problem = parseProblemDetail(error);
    return {
      message: problem
        ? getErrorMessage(problem, 'A server error occurred. Please try again later.')
        : 'A server error occurred. Please try again later.',
      variant: 'error',
      suppressToast: false,
      fieldErrors: [],
    };
  }

  // Fallback for unhandled status codes
  return {
    message: `An unexpected error occurred (${error.status})`,
    variant: 'error',
    suppressToast: false,
    fieldErrors: [],
  };
}

// ---------------------------------------------------------------------------
// Error-to-notification bridge (response interceptor)
// ---------------------------------------------------------------------------

/**
 * Custom header that callers can set to suppress the auto-toast.
 * Used by forms that handle their own error display.
 *
 * @example
 * await http.post('/items', data, {
 *   headers: { [SUPPRESS_TOAST_HEADER]: 'true' },
 * });
 */
export const SUPPRESS_TOAST_HEADER = 'X-Suppress-Toast';

/**
 * Request interceptor that strips the client-only `X-Suppress-Toast` header
 * before the request reaches the network, preventing it from leaking to the
 * server.
 *
 * Wire this into the HTTP client:
 * ```ts
 * http.addRequestInterceptor(stripClientOnlyHeaders);
 * ```
 */
export const stripClientOnlyHeaders: RequestInterceptor = (context) => {
  if (SUPPRESS_TOAST_HEADER in context.headers) {
    const { [SUPPRESS_TOAST_HEADER]: _, ...rest } = context.headers;
    return { ...context, headers: rest };
  }
  return context;
};

/**
 * Error interceptor wired into the HTTP client to auto-show toasts.
 *
 * Must be registered AFTER the auth error interceptor so 401 refresh
 * is attempted first. Only fires when the error is NOT recovered by
 * a prior interceptor.
 *
 * Register on the HTTP client:
 * ```ts
 * http.addErrorInterceptor(notificationErrorInterceptor);
 * ```
 */
export const notificationErrorInterceptor: ErrorInterceptor = (
  error: unknown,
  context: HttpRequestContext,
): never => {
  if (error instanceof HttpError) {
    const result = handleHttpError(error);

    // Check if the caller explicitly suppressed the toast
    const suppressed = context.headers[SUPPRESS_TOAST_HEADER] === 'true';

    if (!result.suppressToast && !suppressed) {
      useAppStore.getState().addNotification(result.message, {
        variant: result.variant,
        duration: result.variant === 'error' ? 8000 : 5000,
      });
    }
  }

  // Always re-throw — this interceptor is for side-effects only
  // eslint-disable-next-line @typescript-eslint/only-throw-error
  throw error;
}
