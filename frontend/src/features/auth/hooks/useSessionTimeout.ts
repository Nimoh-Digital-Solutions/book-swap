import { useCallback,useEffect, useRef } from 'react';

import { useAuthStore } from '../stores/authStore';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** User interaction events that reset the idle timer. */
const ACTIVITY_EVENTS: ReadonlyArray<keyof WindowEventMap> = [
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
];

/** Default warning threshold: 2 minutes before auto-logout. */
const WARNING_LEAD_MS = 2 * 60 * 1000;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface UseSessionTimeoutOptions {
  /**
   * Minutes of inactivity before the user is logged out.
   * @default 30
   */
  idleMinutes?: number;
  /**
   * Callback fired `warningLeadMs` before the logout timer fires.
   * Use this to show a "Your session is about to expire" dialog.
   */
  onWarning?: () => void;
  /**
   * Callback fired when the session timeout expires and the user is
   * logged out due to inactivity.
   */
  onTimeout?: () => void;
  /**
   * How many milliseconds before logout to fire `onWarning`.
   * @default 120_000 (2 minutes)
   */
  warningLeadMs?: number;
}

/**
 * useSessionTimeout
 *
 * Detects user inactivity and automatically logs out after
 * `idleMinutes` of no interaction. Fires an optional `onWarning`
 * callback shortly before logout so the UI can show a confirmation
 * dialog.
 *
 * Only active when the user is authenticated — no timers are set
 * for anonymous users.
 *
 * @example
 * useSessionTimeout({
 *   idleMinutes: 30,
 *   onWarning: () => showSessionExpiringDialog(),
 *   onTimeout: () => toast.warn('You were logged out due to inactivity'),
 * });
 */
export function useSessionTimeout({
  idleMinutes = 30,
  onWarning,
  onTimeout,
  warningLeadMs = WARNING_LEAD_MS,
}: UseSessionTimeoutOptions = {}): void {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const logout = useAuthStore(s => s.logout);

  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const warningRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const idleMs = idleMinutes * 60 * 1000;

  const clearTimers = useCallback(() => {
    if (timeoutRef.current !== undefined) clearTimeout(timeoutRef.current);
    if (warningRef.current !== undefined) clearTimeout(warningRef.current);
    timeoutRef.current = undefined;
    warningRef.current = undefined;
  }, []);

  const resetTimers = useCallback(() => {
    clearTimers();

    // Warning timer (fires `warningLeadMs` before the actual timeout)
    if (onWarning && idleMs > warningLeadMs) {
      warningRef.current = setTimeout(() => {
        onWarning();
      }, idleMs - warningLeadMs);
    }

    // Logout timer
    timeoutRef.current = setTimeout(() => {
      onTimeout?.();
      void logout();
    }, idleMs);
  }, [clearTimers, idleMs, warningLeadMs, onWarning, onTimeout, logout]);

  useEffect(() => {
    if (!isAuthenticated) {
      clearTimers();
      return;
    }

    // Start timers on mount
    resetTimers();

    // Reset timers on any user activity
    const handleActivity = () => resetTimers();

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, handleActivity, { passive: true });
    }

    return () => {
      clearTimers();
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, handleActivity);
      }
    };
  }, [isAuthenticated, resetTimers, clearTimers]);
}
