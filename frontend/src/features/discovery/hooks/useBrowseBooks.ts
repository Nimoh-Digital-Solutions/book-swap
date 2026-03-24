/**
 * useBrowseBooks.ts
 *
 * Page-based query hook for browsing nearby books with filters.
 */
import { useQuery } from '@tanstack/react-query';

import { discoveryService } from '../services/discovery.service';
import type {
  BrowseFilters,
  PaginatedBrowseBooks,
} from '../types/discovery.types';
import { discoveryKeys } from './discoveryKeys';

export function useBrowseBooks(filters: BrowseFilters, enabled = true) {
  return useQuery<PaginatedBrowseBooks>({
    queryKey: discoveryKeys.browseList(filters),
    queryFn: () => discoveryService.browse(filters),
    enabled,
  });
}
