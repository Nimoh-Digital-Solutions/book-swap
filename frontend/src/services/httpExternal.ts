import { createHttpClient, type HttpClient, type RequestInterceptor } from '@nimoh-digital-solutions/tast-utils';
import { logger } from '@utils/logger';

/**
 * httpExternal — factory for typed clients hitting THIRD-PARTY hosts
 * (ipapi.co, Nominatim, Open Library, Google Books, etc.).
 *
 * Why a separate factory from `http`?
 *  - The main `http` client is bound to `APP_CONFIG.apiUrl`, sends our auth /
 *    CSRF interceptors, and sets `credentials: 'include'`. None of that is
 *    appropriate for third-party hosts.
 *  - Routing external calls through a small wrapper still gives us the things
 *    that matter: a default timeout, dev logging, the same `HttpError` type,
 *    and a single seam to add retry / Sentry breadcrumbs in the future.
 *
 * Each external host gets its own client (with its own `baseUrl`) so call
 * sites stay short and readable: `nominatim.get('/reverse?...')`.
 *
 * @example
 *   const ipapi = createExternalHttpClient({
 *     baseUrl: 'https://ipapi.co',
 *     name: 'ipapi',
 *   });
 *   const { data } = await ipapi.get<{ city?: string }>('/json/');
 */
export interface ExternalHttpClientConfig {
  /** Base URL of the third-party service (no trailing slash). */
  baseUrl: string;
  /** Short name used for dev log breadcrumbs. */
  name: string;
  /** Default timeout in ms. Defaults to 5000. */
  defaultTimeout?: number;
  /** Optional headers applied to every request (e.g. a User-Agent for Nominatim). */
  defaultHeaders?: Record<string, string>;
}

export function createExternalHttpClient(config: ExternalHttpClientConfig): HttpClient {
  const { baseUrl, name, defaultTimeout = 5_000, defaultHeaders } = config;

  const loggingInterceptor: RequestInterceptor = (context) => {
    if (import.meta.env.DEV) {
      logger.debug(`[http:${name}] ${context.method} ${context.url}`);
    }
    return context;
  };

  const headersInterceptor: RequestInterceptor | null = defaultHeaders
    ? (context) => ({
        ...context,
        headers: { ...defaultHeaders, ...context.headers },
      })
    : null;

  return createHttpClient({
    baseUrl,
    defaultTimeout,
    requestInterceptors: headersInterceptor
      ? [loggingInterceptor, headersInterceptor]
      : [loggingInterceptor],
  });
}
