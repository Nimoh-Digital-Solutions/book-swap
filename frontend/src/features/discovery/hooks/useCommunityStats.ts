/**
 * useCommunityStats.ts
 *
 * Fetches weekly swap count and recent activity feed for the community section.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { discoveryService } from '../services/discovery.service';
import type { CommunityStats } from '../types/discovery.types';
import { discoveryKeys } from './discoveryKeys';

export function useCommunityStats(
  lat?: number,
  lng?: number,
  radius = 10000,
): UseQueryResult<CommunityStats> {
  return useQuery({
    queryKey: discoveryKeys.communityStats(lat, lng, radius),
    queryFn: () => discoveryService.communityStats(lat!, lng!, radius),
    enabled: lat != null && lng != null,
    staleTime: 60_000,
  });
}
