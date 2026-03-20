import type { HttpClient } from '@nimoh-digital-solutions/tast-utils';
import type { ApiResponse } from '@nimoh-digital-solutions/tast-utils';
import { logger } from '@utils/logger';

// ---------------------------------------------------------------------------
// In-flight request cache
// ---------------------------------------------------------------------------

/** Keyed by method + endpoint + serialised query params. */
const inflight = new Map<string, Promise<unknown>>();

function cacheKey(method: string, endpoint: string): string {
  return `${method}:${endpoint}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * withDeduplication — wraps an `HttpClient` so that identical concurrent
 * GET requests are collapsed into a single network call.
 *
 * When a GET for `/users` is already in flight and a second caller requests
 * the same endpoint before the first resolves, the second call piggybacks on
 * the original promise. Once resolved, the entry is removed from the cache
 * so subsequent requests hit the network as normal.
 *
 * Mutating methods (POST, PUT, PATCH, DELETE) are never deduplicated.
 *
 * @example
 * ```ts
 * import { http } from '@services';
 * import { withDeduplication } from '@services/deduplication';
 *
 * const dedupHttp = withDeduplication(http);
 *
 * // These two fire a single network request:
 * const [a, b] = await Promise.all([
 *   dedupHttp.get('/users'),
 *   dedupHttp.get('/users'),
 * ]);
 * ```
 */
export function withDeduplication(client: HttpClient): HttpClient {
  return {
    ...client,

    get<T>(endpoint: string, init?: Omit<RequestInit, 'method' | 'body'>): Promise<ApiResponse<T>> {
      const key = cacheKey('GET', endpoint);
      const existing = inflight.get(key) as Promise<ApiResponse<T>> | undefined;

      if (existing) {
        logger.debug('[dedup] Reusing in-flight GET', { endpoint });
        return existing;
      }

      const promise = client.get<T>(endpoint, init).finally(() => {
        inflight.delete(key);
      });

      inflight.set(key, promise);
      return promise;
    },
  };
}
