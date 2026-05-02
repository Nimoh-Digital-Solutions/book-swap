/**
 * useMapBooks.ts
 *
 * Query hook for fetching all books within radius for map view.
 * Uses a high page_size (200) to get all results in one request.
 */
import { useQuery } from '@tanstack/react-query';

import { discoveryService } from '../services/discovery.service';
import type { BrowseFilters } from '../types/discovery.types';
import { discoveryKeys } from './discoveryKeys';

const MAP_PAGE_SIZE = 200;

/** Round to 3 decimal places (~111 m) to stabilise query keys across GPS drift. */
function roundCoord(v?: number): number | undefined {
  return v != null ? Math.round(v * 1e3) / 1e3 : undefined;
}

export function useMapBooks(filters: BrowseFilters, enabled = true) {
  const stableFilters: BrowseFilters = {
    ...filters,
    lat: roundCoord(filters.lat),
    lng: roundCoord(filters.lng),
  };
  return useQuery({
    queryKey: [...discoveryKeys.browseList(stableFilters), 'map'],
    queryFn: () =>
      discoveryService.browse({ ...stableFilters, page_size: MAP_PAGE_SIZE }),
    enabled,
  });
}
