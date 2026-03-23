/**
 * useSendMessage.ts
 *
 * TanStack Query mutation hook for sending a chat message.
 * Optimistically appends the new message to the query cache on success.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { messagingService } from '../services/messaging.service';
import type { ChatMessage, SendMessagePayload } from '../types/messaging.types';
import { messagingKeys } from './messagingKeys';

interface SendMessageVars {
  exchangeId: string;
  payload: SendMessagePayload;
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation<ChatMessage, Error, SendMessageVars>({
    mutationFn: ({ exchangeId, payload }) =>
      messagingService.sendMessage(exchangeId, payload),
    onSuccess: (_data, { exchangeId }) => {
      void qc.invalidateQueries({
        queryKey: messagingKeys.messageList(exchangeId),
      });
    },
  });
}
