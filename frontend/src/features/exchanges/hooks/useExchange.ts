/**
 * useExchange.ts
 *
 * TanStack Query hook for fetching a single exchange detail.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { exchangeService } from '../services/exchange.service';
import type { ExchangeDetail } from '../types/exchange.types';
import { exchangeKeys } from './exchangeKeys';

export function useExchange(
  id: string,
  enabled = true,
): UseQueryResult<ExchangeDetail> {
  return useQuery({
    queryKey: exchangeKeys.detail(id),
    queryFn: () => exchangeService.getDetail(id),
    enabled,
  });
}
