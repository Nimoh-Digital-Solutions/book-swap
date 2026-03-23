/**
 * useExchangeRatingStatus.ts
 *
 * TanStack Query hook for fetching the rating status of a specific exchange.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { ratingService } from '../services/rating.service';
import type { ExchangeRatingStatus } from '../types/rating.types';
import { ratingKeys } from './ratingKeys';

export function useExchangeRatingStatus(
  exchangeId: string,
  options?: { enabled?: boolean },
): UseQueryResult<ExchangeRatingStatus> {
  return useQuery({
    queryKey: ratingKeys.exchangeStatus(exchangeId),
    queryFn: () => ratingService.getExchangeStatus(exchangeId),
    enabled: !!exchangeId && (options?.enabled ?? true),
  });
}
