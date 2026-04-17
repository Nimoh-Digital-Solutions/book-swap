import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { tokenStorage } from '@/lib/storage';
import { wsManager } from '@/services/websocket';
import { useNotificationWsSync } from '@/features/notifications/hooks/useNotifications';

/**
 * Keeps `/ws/notifications/` connected while authenticated.
 * Chat uses the same `wsManager` and overrides the path until unmounted.
 */
export function WebSocketGate(): null {
  const prevAuthRef = useRef<boolean | null>(null);
  const prevTokenRef = useRef<string | null>(null);

  useNotificationWsSync();

  useEffect(() => {
    const sync = () => {
      const { isAuthenticated } = useAuthStore.getState();
      const accessToken = tokenStorage.getAccess();
      const changed =
        prevAuthRef.current !== isAuthenticated || prevTokenRef.current !== accessToken;
      if (!changed) return;
      prevAuthRef.current = isAuthenticated;
      prevTokenRef.current = accessToken;

      if (isAuthenticated && accessToken) {
        wsManager.connect('/ws/notifications/');
      } else {
        wsManager.disconnect();
      }
    };

    sync();
    return useAuthStore.subscribe(sync);
  }, []);

  return null;
}
