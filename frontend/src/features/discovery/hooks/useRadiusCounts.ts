/**
 * useRadiusCounts.ts
 *
 * TanStack Query hook for fetching book counts per radius bucket.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { discoveryService } from '../services/discovery.service';
import type { RadiusCounts } from '../types/discovery.types';
import { discoveryKeys } from './discoveryKeys';

export function useRadiusCounts(
  enabled = true,
): UseQueryResult<RadiusCounts> {
  return useQuery({
    queryKey: discoveryKeys.radiusCounts(),
    queryFn: () => discoveryService.radiusCounts(),
    enabled,
  });
}
