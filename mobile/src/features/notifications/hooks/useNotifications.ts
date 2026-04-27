import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '@/services/http';
import { showErrorToast } from '@/components/Toast';
import { API } from '@/configs/apiEndpoints';
import { wsManager } from '@/services/websocket';
import type { Notification } from '@/types';

export interface NotificationListResponse {
  unread_count: number;
  results: Notification[];
}

const MAX_CACHED = 50;

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await http.get<NotificationListResponse>(
        API.notifications.list,
      );
      return data;
    },
    refetchInterval: 30_000,
  });
}

export function useUnreadCount(): number {
  const { data } = useNotifications();
  return data?.unread_count ?? 0;
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: async (id: string) => {
      await http.post(API.notifications.markRead(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => {
      showErrorToast(
        t('notifications.markReadError', 'Could not update notification.'),
      );
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: async () => {
      await http.post(API.notifications.markAllRead);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => {
      showErrorToast(
        t('notifications.markAllReadError', 'Could not mark all as read.'),
      );
    },
  });
}

/**
 * Listens for `notification.push` on the shared WebSocket and
 * prepends the new notification to the cached list + increments unread count.
 */
export function useNotificationWsSync() {
  const qc = useQueryClient();

  useEffect(() => {
    const unsub = wsManager.on('notification.push', (data: unknown) => {
      const msg = data as { notification?: Notification };
      const notif = msg.notification;
      if (!notif?.id) return;

      qc.setQueryData<NotificationListResponse>(
        ['notifications'],
        (old) => {
          if (!old) return old;
          const exists = old.results.some((n) => n.id === notif.id);
          if (exists) return old;
          return {
            unread_count: old.unread_count + 1,
            results: [notif, ...old.results].slice(0, MAX_CACHED),
          };
        },
      );
    });

    return unsub;
  }, [qc]);
}
