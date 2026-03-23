/**
 * useExchanges.ts
 *
 * TanStack Query hook for listing the current user's exchanges.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { exchangeService } from '../services/exchange.service';
import type { PaginatedExchanges } from '../types/exchange.types';
import { exchangeKeys } from './exchangeKeys';

export function useExchanges(): UseQueryResult<PaginatedExchanges> {
  return useQuery({
    queryKey: exchangeKeys.lists(),
    queryFn: () => exchangeService.list(),
  });
}
