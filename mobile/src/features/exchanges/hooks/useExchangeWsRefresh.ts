import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { wsManager } from '@/services/websocket';

const EXCHANGE_NOTIFICATION_TYPES = new Set([
  'new_request',
  'request_accepted',
  'request_declined',
  'request_expired',
  'exchange_completed',
  'new_message',
]);

/**
 * Listens for exchange-related WS notifications and invalidates
 * exchange queries so the UI reflects status changes in real time.
 */
export function useExchangeWsRefresh() {
  const qc = useQueryClient();

  useEffect(() => {
    const handler = (data: unknown) => {
      const msg = data as { notification?: { notification_type?: string } };
      const nType = msg.notification?.notification_type ?? '';
      if (EXCHANGE_NOTIFICATION_TYPES.has(nType)) {
        qc.invalidateQueries({ queryKey: ['exchanges'] });
      }
    };

    const unsub = wsManager.on('notification.push', handler);
    return unsub;
  }, [qc]);
}
