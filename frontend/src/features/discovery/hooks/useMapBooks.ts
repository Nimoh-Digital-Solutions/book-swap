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

export function useMapBooks(filters: BrowseFilters, enabled = true) {
  return useQuery({
    queryKey: [...discoveryKeys.browseList(filters), 'map'],
    queryFn: () =>
      discoveryService.browse({ ...filters, page_size: MAP_PAGE_SIZE }),
    enabled,
  });
}
