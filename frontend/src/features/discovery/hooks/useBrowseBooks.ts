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

/** Round to 3 decimal places (~111 m) to stabilise query keys across GPS drift. */
function roundCoord(v?: number): number | undefined {
  return v != null ? Math.round(v * 1e3) / 1e3 : undefined;
}

export function useBrowseBooks(filters: BrowseFilters, enabled = true) {
  const stableFilters: BrowseFilters = {
    ...filters,
    lat: roundCoord(filters.lat),
    lng: roundCoord(filters.lng),
  };
  return useQuery<PaginatedBrowseBooks>({
    queryKey: discoveryKeys.browseList(stableFilters),
    queryFn: () => discoveryService.browse(stableFilters),
    enabled,
  });
}
