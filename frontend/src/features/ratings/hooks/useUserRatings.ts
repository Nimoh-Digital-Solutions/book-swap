/**
 * useUserRatings.ts
 *
 * TanStack Query hook for fetching public ratings for a specific user.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { ratingService } from '../services/rating.service';
import type { PaginatedRatings } from '../types/rating.types';
import { ratingKeys } from './ratingKeys';

export function useUserRatings(
  userId: string,
  options?: { enabled?: boolean },
): UseQueryResult<PaginatedRatings> {
  return useQuery({
    queryKey: ratingKeys.userRating(userId),
    queryFn: () => ratingService.listUserRatings(userId),
    enabled: !!userId && (options?.enabled ?? true),
  });
}
