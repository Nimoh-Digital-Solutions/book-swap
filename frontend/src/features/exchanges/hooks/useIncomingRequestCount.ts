/**
 * useIncomingRequestCount.ts
 *
 * TanStack Query hook for the incoming request badge count.
 * Polls every 60 s so the nav badge stays reasonably fresh.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { exchangeService } from '../services/exchange.service';
import type { IncomingCount } from '../types/exchange.types';
import { exchangeKeys } from './exchangeKeys';

export function useIncomingRequestCount(): UseQueryResult<IncomingCount> {
  return useQuery({
    queryKey: exchangeKeys.incomingCount(),
    queryFn: () => exchangeService.incomingCount(),
    refetchInterval: 60_000,
  });
}
