import type { ApiResponse } from '@nimoh-digital-solutions/tast-utils';
import { http } from '@services';
import {
  type QueryKey,
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';

/**
 * useApiQuery — typed wrapper around TanStack Query's `useQuery` that fetches
 * from the app's HTTP client.
 *
 * Automatically handles:
 * - Request timeout (via HTTP client)
 * - Auth header injection (via interceptors)
 * - Request cancellation on unmount (via AbortSignal)
 * - Smart retry for server/network errors
 * - Response caching and background refresh
 *
 * @param queryKey - Unique cache key for this query
 * @param endpoint - API endpoint (relative to baseUrl, e.g. '/users')
 * @param options  - Standard UseQueryOptions overrides (minus queryKey/queryFn)
 *
 * @example
 * const { data, isLoading, error } = useApiQuery<User[]>(
 *   ['users'],
 *   '/users',
 * );
 *
 * @example
 * // With query params and custom options
 * const { data } = useApiQuery<Story>(
 *   ['stories', storyId],
 *   `/stories/${storyId}`,
 *   { enabled: !!storyId, staleTime: 60_000 },
 * );
 */
export function useApiQuery<TData = unknown, TError = Error>(
  queryKey: QueryKey,
  endpoint: string,
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>,
): UseQueryResult<TData, TError> {
  return useQuery<TData, TError>({
    queryKey,
    queryFn: async ({ signal }) => {
      const response: ApiResponse<TData> = await http.get<TData>(endpoint, { signal });
      return response.data;
    },
    ...options,
  });
}
