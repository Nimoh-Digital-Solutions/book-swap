/**
 * useUserRatings.ts
 *
 * TanStack `useInfiniteQuery` hook for fetching paginated public ratings.
 *
 * Why infinite (and not `useQuery`)?
 *  - The backend (`UserRatingsViewSet`) paginates with `?page=N` at 25/page,
 *    capped at `max_page_size=100`.
 *  - Rendering "all ratings" on a single page would unbound the DOM weight
 *    once a power user accumulates hundreds of ratings (AUD-W-501).
 *  - With `useInfiniteQuery` the rendered list grows one page at a time on
 *    explicit user action (`fetchNextPage`), keeping the DOM bounded without
 *    needing a virtualization library.
 */
import {
  type InfiniteData,
  useInfiniteQuery,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query';

import { ratingService } from '../services/rating.service';
import type { PaginatedRatings } from '../types/rating.types';
import { ratingKeys } from './ratingKeys';

export function useUserRatings(
  userId: string,
  options?: { enabled?: boolean },
): UseInfiniteQueryResult<InfiniteData<PaginatedRatings>> {
  return useInfiniteQuery({
    queryKey: ratingKeys.userRating(userId),
    queryFn: ({ pageParam }) =>
      ratingService.listUserRatings(userId, pageParam as number),
    enabled: !!userId && (options?.enabled ?? true),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.next ? allPages.length + 1 : undefined,
  });
}
