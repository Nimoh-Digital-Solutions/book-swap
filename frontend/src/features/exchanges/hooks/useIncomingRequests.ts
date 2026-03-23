/**
 * useIncomingRequests.ts
 *
 * TanStack Query hook for fetching incoming exchange requests (owner perspective).
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { exchangeService } from '../services/exchange.service';
import type { ExchangeListItem } from '../types/exchange.types';
import { exchangeKeys } from './exchangeKeys';

export function useIncomingRequests(): UseQueryResult<ExchangeListItem[]> {
  return useQuery({
    queryKey: exchangeKeys.incomingList(),
    queryFn: () => exchangeService.incoming(),
  });
}
