/**
 * useNotificationWebSocket.ts
 *
 * React hook that manages the WebSocket connection for real-time notification
 * bell updates (US-902).
 *
 * - Connects to `ws/notifications/` on mount (when enabled and authenticated)
 * - Prepends incoming `notification.push` events to the TanStack Query cache
 *   so the bell icon and panel update instantly without a refetch
 * - Increments the unread_count in the same cache entry
 */
import { useCallback } from 'react';

import { APP_CONFIG } from '@configs/appConfig';
import type { WsMessage } from '@services';
import { useWebSocket } from '@services';
import { useQueryClient } from '@tanstack/react-query';

import type {
  Notification,
  NotificationListResponse,
  NotificationPushEvent,
} from '../types/notification.types';
import { notificationKeys } from './notificationKeys';

const EXCHANGE_NOTIFICATION_TYPES = new Set([
  'new_request',
  'request_accepted',
  'request_declined',
  'request_expired',
  'request_cancelled',
  'counter_proposed',
  'counter_approved',
  'swap_confirmed',
  'exchange_completed',
  'return_requested',
  'exchange_returned',
  'new_message',
]);

// ---------------------------------------------------------------------------
// Type guard
// ---------------------------------------------------------------------------

function isNotificationPush(msg: unknown): msg is NotificationPushEvent {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    (msg as Record<string, unknown>)['type'] === 'notification.push' &&
    'notification' in msg
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseNotificationWebSocketOptions {
  /** Whether to open the connection. Pass `false` when the user is unauthenticated. */
  enabled?: boolean;
  /** Called when a new notification arrives via WebSocket. */
  onNewNotification?: (notification: Notification) => void;
}

export interface UseNotificationWebSocketReturn {
  isConnected: boolean;
}

export function useNotificationWebSocket(
  options: UseNotificationWebSocketOptions = {},
): UseNotificationWebSocketReturn {
  const { enabled = true, onNewNotification } = options;

  const qc = useQueryClient();

  const wsUrl = `${APP_CONFIG.wsUrl}/ws/notifications/`;

  const handleMessage = useCallback(
    (msg: WsMessage) => {
      if (!isNotificationPush(msg)) return;

      const { notification } = msg as NotificationPushEvent;

      // Prepend to the cached list and increment unread_count
      qc.setQueryData<NotificationListResponse>(
        notificationKeys.list(),
        (old) => {
          if (!old) {
            return { unread_count: 1, results: [notification] };
          }
          return {
            unread_count: old.unread_count + 1,
            results: [notification, ...old.results].slice(0, 50),
          };
        },
      );

      if (EXCHANGE_NOTIFICATION_TYPES.has(notification.notification_type)) {
        void qc.invalidateQueries({ queryKey: ['exchanges'] });
      }

      onNewNotification?.(notification);
    },
    [qc, onNewNotification],
  );

  const { isConnected } = useWebSocket({
    url: wsUrl,
    onMessage: handleMessage,
    enabled,
    reconnect: true,
    maxRetries: 5,
  });

  return { isConnected };
}
