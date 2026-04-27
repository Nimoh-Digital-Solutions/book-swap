/**
 * discoveryKeys.ts
 *
 * TanStack Query key factory for the discovery feature.
 */
import type { BrowseFilters } from '../types/discovery.types';

export const discoveryKeys = {
  all: ['discovery'] as const,
  browse: () => [...discoveryKeys.all, 'browse'] as const,
  browseList: (filters: BrowseFilters) =>
    [...discoveryKeys.browse(), filters] as const,
  radiusCounts: () => [...discoveryKeys.all, 'radius-counts'] as const,
  nearbyCount: (lat?: number, lng?: number) =>
    [...discoveryKeys.all, 'nearby-count', lat, lng] as const,
  communityStats: (lat?: number, lng?: number) =>
    [...discoveryKeys.all, 'community-stats', lat, lng] as const,
};
