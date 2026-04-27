import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { tokenStorage } from '@/lib/storage';
import { wsManager } from '@/services/websocket';
import { useNotificationWsSync } from '@/features/notifications/hooks/useNotifications';
import { usePushRegistration } from '@/hooks/usePushRegistration';
import { showErrorToast } from '@/components/Toast';

/**
 * Keeps `/ws/notifications/` connected while authenticated.
 * Chat uses the same `wsManager` and overrides the path until unmounted.
 */
export function WebSocketGate(): null {
  const { t } = useTranslation();
  const prevAuthRef = useRef<boolean | null>(null);
  const prevTokenRef = useRef<string | null>(null);

  useNotificationWsSync();
  usePushRegistration();

  useEffect(() => {
    const unsubExhausted = wsManager.on('__ws_exhausted__', () => {
      showErrorToast(
        t(
          'errors.websocketExhausted',
          'Could not reconnect. Pull to refresh or reopen the app to restore live updates.',
        ),
      );
    });
    return unsubExhausted;
  }, [t]);

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
