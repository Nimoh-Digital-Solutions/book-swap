/**
 * discoveryKeys.ts
 *
 * TanStack Query key factory for the discovery feature.
 */
import type { BrowseFilters } from '../types/discovery.types';

/** Round to 3 decimal places (~111 m) to stabilise query keys across GPS drift. */
function roundCoord(v?: number): number | undefined {
  return v != null ? Math.round(v * 1e3) / 1e3 : undefined;
}

export const discoveryKeys = {
  all: ['discovery'] as const,
  browse: () => [...discoveryKeys.all, 'browse'] as const,
  browseList: (filters: BrowseFilters) =>
    [...discoveryKeys.browse(), filters] as const,
  radiusCounts: () => [...discoveryKeys.all, 'radius-counts'] as const,
  nearbyCount: (lat?: number, lng?: number, radius?: number) =>
    [...discoveryKeys.all, 'nearby-count', roundCoord(lat), roundCoord(lng), radius] as const,
  communityStats: (lat?: number, lng?: number, radius?: number) =>
    [...discoveryKeys.all, 'community-stats', roundCoord(lat), roundCoord(lng), radius] as const,
};
