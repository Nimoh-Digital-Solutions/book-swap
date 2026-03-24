/**
 * useSubmitRating.ts
 *
 * TanStack Query mutation hook for submitting a rating for an exchange.
 */
import { exchangeKeys } from '@features/exchanges';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { ratingService } from '../services/rating.service';
import type { Rating, SubmitRatingPayload } from '../types/rating.types';
import { ratingKeys } from './ratingKeys';

export function useSubmitRating(exchangeId: string) {
  const qc = useQueryClient();
  return useMutation<Rating, Error, SubmitRatingPayload>({
    mutationFn: (payload) => ratingService.submitRating(exchangeId, payload),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ratingKeys.exchangeStatus(exchangeId),
      });
      qc.invalidateQueries({ queryKey: exchangeKeys.detail(exchangeId) });
    },
  });
}
