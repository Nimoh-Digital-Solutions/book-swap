import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import {
  registerForPushNotifications,
  sendPushTokenToBackend,
} from '@/services/pushNotifications';

/**
 * Registers the device for Expo push notifications when the user is
 * authenticated. Runs once after login/hydrate; skips simulators and
 * denied permissions gracefully.
 */
export function usePushRegistration(): void {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const registered = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || registered.current) return;

    let cancelled = false;
    (async () => {
      try {
        const token = await registerForPushNotifications();
        if (cancelled || !token) return;
        await sendPushTokenToBackend(token);
        registered.current = true;
      } catch {
        // Best-effort; will retry on next app launch
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      registered.current = false;
    }
  }, [isAuthenticated]);
}
