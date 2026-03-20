import { APP_CONFIG } from '@configs';
import type { RequestInterceptor } from '@nimoh-digital-solutions/tast-utils';
import { createHttpClient } from '@nimoh-digital-solutions/tast-utils';
import { logger } from '@utils/logger';

import { stripClientOnlyHeaders } from './errorHandlers';

// Re-export HttpError and HTTP types so import sites don't need a separate
// import from @nimoh-digital-solutions/tast-utils.
export type {
  ErrorInterceptor,
  HttpClient,
  HttpClientConfig,
  HttpRequestContext,
  PaginatedResponse,
  ProblemDetail,
  RequestInterceptor,
  ResponseInterceptor,
} from '@nimoh-digital-solutions/tast-utils';
export { HttpError } from '@nimoh-digital-solutions/tast-utils';

// ---------------------------------------------------------------------------
// Logging interceptor (dev only)
// ---------------------------------------------------------------------------
const loggingInterceptor: RequestInterceptor = (context) => {
  if (import.meta.env.DEV) {
    logger.debug(`[http] ${context.method} ${context.url}`);
  }
  return context;
};

// ---------------------------------------------------------------------------
// HTTP Client instance
// ---------------------------------------------------------------------------

/**
 * http — pre-configured fetch wrapper pointing at APP_CONFIG.apiUrl.
 *
 * Features:
 * - Request/response/error interceptor chain
 * - 30s default request timeout (AbortSignal.timeout)
 * - `credentials: 'include'` for httpOnly cookie auth flows
 * - Dev-mode request logging
 *
 * Auth and CSRF interceptors are added at runtime by the auth module
 * via `http.addRequestInterceptor()` once the auth store initialises.
 *
 * @example
 * import { http } from '@services';
 *
 * const { data } = await http.get<User[]>('/users');
 * await http.post<User>('/users', { name: 'Alice' });
 * await http.delete('/users/1');
 */
export const http = createHttpClient({
  baseUrl: APP_CONFIG.apiUrl ?? '',
  credentials: 'include',
  defaultTimeout: 30_000,
  requestInterceptors: [loggingInterceptor, stripClientOnlyHeaders],
});
