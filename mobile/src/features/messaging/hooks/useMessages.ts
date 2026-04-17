import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '@/services/http';
import { API } from '@/configs/apiEndpoints';
import type { Message } from '@/types';

interface MessagesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Message[];
}

export function useMessages(exchangeId: string) {
  return useQuery({
    queryKey: ['messages', exchangeId],
    queryFn: async () => {
      const { data } = await http.get<MessagesResponse>(
        API.messaging.messages(exchangeId),
      );
      return data.results;
    },
    enabled: !!exchangeId,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ exchangeId, content }: { exchangeId: string; content: string }) => {
      const { data } = await http.post<Message>(
        API.messaging.messages(exchangeId),
        { content },
      );
      return data;
    },
    onSuccess: (newMsg, { exchangeId }) => {
      qc.setQueryData<Message[]>(['messages', exchangeId], (old) => {
        if (!old) return [newMsg];
        if (old.some((m) => m.id === newMsg.id)) return old;
        return [...old, newMsg];
      });
    },
  });
}

export function useMarkMessagesRead() {
  return useMutation({
    mutationFn: async (exchangeId: string) => {
      const { data } = await http.post(API.messaging.markRead(exchangeId));
      return data;
    },
  });
}
