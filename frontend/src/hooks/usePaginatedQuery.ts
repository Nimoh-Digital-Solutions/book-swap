import type { ApiResponse, PaginatedResponse } from '@nimoh-digital-solutions/tast-utils';
import { http } from '@services';
import {
  type InfiniteData,
  type QueryKey,
  useInfiniteQuery,
  type UseInfiniteQueryOptions,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query';

/**
 * usePaginatedQuery — typed wrapper around TanStack Query's `useInfiniteQuery`
 * designed for DRF's page-number pagination envelope:
 *
 * ```json
 * { "count": 42, "next": "...?page=2", "previous": null, "results": [...] }
 * ```
 *
 * Automatically extracts the `page` parameter from the `next` URL to fetch
 * subsequent pages.
 *
 * @param queryKey - Unique cache key for this query
 * @param endpoint - API endpoint (relative, e.g. '/stories')
 * @param params   - Additional query parameters (e.g. { page_size: 20, category: 'heritage' })
 * @param options  - Standard UseInfiniteQueryOptions overrides
 *
 * @example
 * const {
 *   data,
 *   fetchNextPage,
 *   hasNextPage,
 *   isFetchingNextPage,
 * } = usePaginatedQuery<Story>(
 *   ['stories', filters],
 *   '/stories',
 *   { page_size: 20, category: 'heritage' },
 * );
 *
 * // Flatten all pages into a single array
 * const allStories = data?.pages.flatMap(page => page.results) ?? [];
 */
export function usePaginatedQuery<TItem = unknown, TError = Error>(
  queryKey: QueryKey,
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>,
  options?: Omit<
    UseInfiniteQueryOptions<PaginatedResponse<TItem>, TError, InfiniteData<PaginatedResponse<TItem>>>,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'
  >,
): UseInfiniteQueryResult<InfiniteData<PaginatedResponse<TItem>>, TError> {
  return useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam, signal }) => {
      // Build query string from params + current page
      const searchParams = new URLSearchParams();

      if (params) {
        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined) {
            searchParams.set(key, String(value));
          }
        }
      }

      searchParams.set('page', String(pageParam));

      const url = `${endpoint}?${searchParams.toString()}`;
      const response: ApiResponse<PaginatedResponse<TItem>> = await http.get(url, { signal });
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage.next) return undefined;

      // Extract page number from DRF's `next` URL (e.g. "...?page=3&page_size=20")
      try {
        const url = new URL(lastPage.next);
        const nextPage = url.searchParams.get('page');
        return nextPage ? Number(nextPage) : undefined;
      } catch {
        return undefined;
      }
    },
    ...options,
  });
}
