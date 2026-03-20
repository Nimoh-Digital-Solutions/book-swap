import { QueryClient } from '@tanstack/react-query';

import { HttpError } from './http';

/**
 * shouldRetry — determines whether a failed query should be retried.
 *
 * Retries up to `maxRetries` times for transient errors (5xx, network).
 * Never retries client errors (4xx) since those won't self-resolve.
 */
function shouldRetry(failureCount: number, error: unknown, maxRetries = 3): boolean {
  if (failureCount >= maxRetries) return false;

  if (error instanceof HttpError) {
    // Never retry client errors — they won't self-resolve
    if (error.status >= 400 && error.status < 500) return false;
    // Retry server errors (5xx)
    return true;
  }

  // Retry network / timeout errors
  return true;
}

/**
 * queryClient — singleton TanStack Query client for the app.
 *
 * Configuration rationale:
 * - staleTime (5 min): Data is considered fresh for 5 minutes before
 *   background refetch is triggered. Balances freshness vs. API load.
 * - gcTime (10 min): Unused query data stays in cache for 10 minutes
 *   before garbage collection. Covers typical navigation back patterns.
 * - retry: Smart retry — retries server/network errors up to 3 times,
 *   never retries 4xx client errors.
 * - refetchOnWindowFocus: Refreshes stale data when the user returns to
 *   the tab. Keeps data current without manual refresh.
 * - mutations: No auto-retry — mutations are not idempotent by default.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error) => shouldRetry(failureCount, error),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
    },
  },
});
