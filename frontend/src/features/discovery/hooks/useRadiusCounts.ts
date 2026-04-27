/**
 * useRadiusCounts.ts
 *
 * TanStack Query hook for fetching book counts per radius bucket.
 * Passes lat/lng so the endpoint works for both authenticated and
 * unauthenticated users.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { discoveryService } from '../services/discovery.service';
import type { RadiusCounts } from '../types/discovery.types';
import { discoveryKeys } from './discoveryKeys';

export function useRadiusCounts(
  lat?: number,
  lng?: number,
  enabled = true,
): UseQueryResult<RadiusCounts> {
  return useQuery({
    queryKey: [...discoveryKeys.radiusCounts(), lat, lng],
    queryFn: () => discoveryService.radiusCounts(lat, lng),
    enabled: enabled && lat != null && lng != null,
  });
}
