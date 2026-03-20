import { useCallback, useEffect, useRef, useState } from 'react';

import { API } from '@configs/apiEndpoints';
import { http } from '@services';
import { logger } from '@utils/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HealthStatus {
  /** `true` when the most recent health check succeeded. */
  isHealthy: boolean;
  /** `true` while a health check is in progress. */
  isChecking: boolean;
  /** ISO timestamp of the last successful check, or `null`. */
  lastCheckedAt: string | null;
  /** Error message from the most recent failed check, or `null`. */
  error: string | null;
}

export interface UseHealthCheckOptions {
  /**
   * Health endpoint path (relative to API base URL).
   * @default API.health
   */
  endpoint?: string;
  /**
   * Interval (ms) between automatic health checks.
   * Set to `0` to disable polling.
   * @default 60_000
   */
  intervalMs?: number;
  /**
   * When `true`, the hook is active. Set to `false` to pause polling
   * (e.g. when no API URL is configured).
   * @default true
   */
  enabled?: boolean;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useHealthCheck — monitors API availability by periodically pinging a
 * health endpoint.
 *
 * Runs an initial check on mount, then polls at `intervalMs`. Integrates
 * with `useNetworkStatus()` — callers can combine offline detection with
 * API health to show an appropriate banner.
 *
 * @example
 * ```tsx
 * import { useHealthCheck } from '@hooks/useHealthCheck';
 * import { useIsOnline } from '@hooks';
 *
 * function ApiStatusBanner() {
 *   const isOnline = useIsOnline();
 *   const { isHealthy, error } = useHealthCheck();
 *
 *   if (!isOnline) return <Banner>You are offline</Banner>;
 *   if (!isHealthy) return <Banner>API unavailable: {error}</Banner>;
 *   return null;
 * }
 * ```
 */
export function useHealthCheck(options?: UseHealthCheckOptions): HealthStatus {
  const {
    endpoint = API.health,
    intervalMs = 60_000,
    enabled = true,
  } = options ?? {};

  const [status, setStatus] = useState<HealthStatus>({
    isHealthy: true,
    isChecking: false,
    lastCheckedAt: null,
    error: null,
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const abortRef = useRef<AbortController | undefined>(undefined);

  const check = useCallback(async () => {
    // Abort any in-flight request before starting a new one
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus(prev => ({ ...prev, isChecking: true }));

    try {
      await http.get(endpoint, { signal: controller.signal });
      setStatus({
        isHealthy: true,
        isChecking: false,
        lastCheckedAt: new Date().toISOString(),
        error: null,
      });
    } catch (err) {
      // Don't update state if the request was intentionally aborted
      if (controller.signal.aborted) return;

      const message = err instanceof Error ? err.message : 'API unreachable';
      logger.warn('[health] API health check failed', { endpoint, error: message });
      setStatus({
        isHealthy: false,
        isChecking: false,
        lastCheckedAt: new Date().toISOString(),
        error: message,
      });
    }
  }, [endpoint]);

  useEffect(() => {
    if (!enabled) return;

    // Initial check
    void check();

    // Use setTimeout chain instead of setInterval to prevent overlapping
    // requests when a single health check takes longer than the interval.
    function scheduleNext() {
      if (intervalMs > 0) {
        timerRef.current = setTimeout(() => {
          void check().then(scheduleNext);
        }, intervalMs);
      }
    }
    scheduleNext();

    return () => {
      if (timerRef.current !== undefined) {
        clearTimeout(timerRef.current);
        timerRef.current = undefined;
      }
      abortRef.current?.abort();
    };
  }, [check, enabled, intervalMs]);

  return status;
}
