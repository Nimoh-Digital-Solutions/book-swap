import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { http } from '@/services/http';
import { API } from '@/configs/apiEndpoints';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { enqueueMutation } from '@/lib/offlineMutationQueue';
import { useAuthStore } from '@/stores/authStore';
import { showInfoToast } from '@/components/Toast';
import type { Message, User } from '@/types';

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
  const { isOffline } = useNetworkStatus();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async ({ exchangeId, content }: { exchangeId: string; content: string }) => {
      const endpoint = API.messaging.messages(exchangeId);

      if (isOffline) {
        enqueueMutation({
          endpoint,
          method: 'post',
          data: { content },
          invalidateKeys: ['messages'],
        });

        const optimistic: Message = {
          id: `offline-${Date.now()}`,
          exchange: exchangeId,
          sender: (user ?? { id: '', username: '' }) as User,
          content,
          image: null,
          read_at: null,
          created_at: new Date().toISOString(),
        };

        showInfoToast(t('offline.queuedForSync'));
        return optimistic;
      }

      const { data } = await http.post<Message>(endpoint, { content });
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
