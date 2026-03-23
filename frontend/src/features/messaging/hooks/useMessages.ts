/**
 * useMessages.ts
 *
 * TanStack Query infinite query hook for paginated chat message history.
 */
import {
  useInfiniteQuery,
  type UseInfiniteQueryResult,
} from '@tanstack/react-query';

import { messagingService } from '../services/messaging.service';
import type { PaginatedMessages } from '../types/messaging.types';
import { messagingKeys } from './messagingKeys';

export function useMessages(
  exchangeId: string,
): UseInfiniteQueryResult<PaginatedMessages> {
  return useInfiniteQuery({
    queryKey: messagingKeys.messageList(exchangeId),
    queryFn: ({ pageParam }) =>
      messagingService.listMessages(exchangeId, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next ?? undefined,
    enabled: !!exchangeId,
  });
}
