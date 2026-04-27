import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { addBreadcrumb } from '@/lib/sentry';

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

let _lastInteractionAt = Date.now();

export function recordInteraction() {
  _lastInteractionAt = Date.now();
}

export function IdleTimeoutGate() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const wentBackgroundAt = useRef<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next.match(/inactive|background/)) {
        wentBackgroundAt.current = Date.now();
        return;
      }

      if (next === 'active' && wentBackgroundAt.current) {
        const bgDuration = Date.now() - wentBackgroundAt.current;
        const idleSinceLastTouch = Date.now() - _lastInteractionAt;
        wentBackgroundAt.current = null;

        if (bgDuration >= IDLE_TIMEOUT_MS && idleSinceLastTouch >= IDLE_TIMEOUT_MS) {
          addBreadcrumb('idle-timeout', 'Session expired due to inactivity', {
            bgDuration,
            idleSinceLastTouch,
          });
          void clearAuth();
        }
      }
    });

    return () => sub.remove();
  }, [isAuthenticated, clearAuth]);

  return null;
}
