/**
 * useMeetupSuggestions.ts
 *
 * TanStack Query hook for fetching meetup location suggestions.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { messagingService } from '../services/messaging.service';
import type { MeetupLocation } from '../types/messaging.types';
import { messagingKeys } from './messagingKeys';

export function useMeetupSuggestions(
  exchangeId: string,
): UseQueryResult<MeetupLocation[]> {
  return useQuery({
    queryKey: messagingKeys.meetupSuggestion(exchangeId),
    queryFn: () => messagingService.getMeetupSuggestions(exchangeId),
    enabled: !!exchangeId,
    staleTime: 5 * 60 * 1000, // Locations don't change often
  });
}
