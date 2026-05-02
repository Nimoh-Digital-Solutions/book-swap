/**
 * useNearbyCount.ts
 *
 * TanStack Query hook for the public nearby-count endpoint (landing page).
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { discoveryService } from '../services/discovery.service';
import type { NearbyCount } from '../types/discovery.types';
import { discoveryKeys } from './discoveryKeys';

export function useNearbyCount(
  lat?: number,
  lng?: number,
  radius = 5000,
): UseQueryResult<NearbyCount> {
  return useQuery({
    queryKey: discoveryKeys.nearbyCount(lat, lng, radius),
    queryFn: () => discoveryService.nearbyCount(lat!, lng!, radius),
    enabled: lat != null && lng != null,
    staleTime: 5 * 60 * 1000,
  });
}
