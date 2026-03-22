/**
 * useBrowseBooks.ts
 *
 * Infinite query hook for browsing nearby books with filters.
 */
import { useInfiniteQuery } from '@tanstack/react-query';

import { discoveryService } from '../services/discovery.service';
import type {
  BrowseFilters,
  PaginatedBrowseBooks,
} from '../types/discovery.types';
import { discoveryKeys } from './discoveryKeys';

export function useBrowseBooks(filters: BrowseFilters, enabled = true) {
  return useInfiniteQuery({
    queryKey: discoveryKeys.browseList(filters),
    queryFn: ({ pageParam }) =>
      discoveryService.browse(filters, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: PaginatedBrowseBooks) =>
      lastPage.next ?? undefined,
    enabled,
  });
}
