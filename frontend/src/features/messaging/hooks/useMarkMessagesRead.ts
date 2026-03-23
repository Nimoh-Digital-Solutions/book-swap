/**
 * useMarkMessagesRead.ts
 *
 * TanStack Query mutation hook for marking all unread messages as read.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { messagingService } from '../services/messaging.service';
import type { MarkReadResponse } from '../types/messaging.types';
import { messagingKeys } from './messagingKeys';

export function useMarkMessagesRead() {
  const qc = useQueryClient();
  return useMutation<MarkReadResponse, Error, string>({
    mutationFn: (exchangeId) => messagingService.markRead(exchangeId),
    onSuccess: (_data, exchangeId) => {
      void qc.invalidateQueries({
        queryKey: messagingKeys.messageList(exchangeId),
      });
    },
  });
}
