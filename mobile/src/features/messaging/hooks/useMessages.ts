import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { http } from '@/services/http';
import { API } from '@/configs/apiEndpoints';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { enqueueMutation } from '@/lib/offlineMutationQueue';
import { useAuthStore } from '@/stores/authStore';
import { showInfoToast } from '@/components/Toast';
import { resolveMediaUrl } from '@/lib/resolveMediaUrl';
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
    select: (serverMessages) =>
      serverMessages
        .filter((m) => !m.id.startsWith('offline-'))
        .map((m) => (m.image ? { ...m, image: resolveMediaUrl(m.image) } : m)),
  });
}

interface SendMessagePayload {
  exchangeId: string;
  content?: string;
  imageUri?: string;
}

export function useSendMessage() {
  const qc = useQueryClient();
  const { isOffline } = useNetworkStatus();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async ({ exchangeId, content, imageUri }: SendMessagePayload) => {
      const endpoint = API.messaging.messages(exchangeId);

      if (isOffline) {
        // AUD-M-103: queue both text-only AND image messages while offline.
        // Image attachments go through the queue's multipart support
        // (offlineMutationQueue.QueuedImageAttachment) so the file is
        // re-uploaded when connectivity returns.
        const attachments = imageUri
          ? [
              {
                field: 'image',
                uri: imageUri,
                filename: imageUri.split('/').pop() ?? 'photo.jpg',
                mimeType:
                  imageUri.split('.').pop()?.toLowerCase() === 'png'
                    ? 'image/png'
                    : 'image/jpeg',
              },
            ]
          : undefined;

        enqueueMutation({
          endpoint,
          method: 'post',
          data: content ? { content } : undefined,
          attachments,
          invalidateKeys: ['messages'],
        });

        const optimistic: Message = {
          id: `offline-${Date.now()}`,
          exchange: exchangeId,
          sender: (user ?? { id: '', username: '' }) as User,
          content: content ?? '',
          // Show the local image immediately in the chat — once the queue
          // drains the server response replaces this entry on next refetch.
          image: imageUri ?? null,
          read_at: null,
          created_at: new Date().toISOString(),
        };

        showInfoToast(t('offline.queuedForSync'));
        return optimistic;
      }

      if (imageUri) {
        const form = new FormData();
        if (content) form.append('content', content);
        const filename = imageUri.split('/').pop() ?? 'photo.jpg';
        const ext = filename.split('.').pop()?.toLowerCase();
        const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
        form.append('image', { uri: imageUri, name: filename, type: mimeType } as unknown as Blob);
        const { data } = await http.post<Message>(endpoint, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
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
