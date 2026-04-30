import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import { showSuccessToast } from '@/components/Toast';
import i18n from '@/lib/i18n';
import { computeIsOffline, netinfoIndicatesOnline } from '@/hooks/networkStatus';

const STALE_QUERY_KEYS = [
  'books', 'myBooks', 'book', 'userBooks', 'recentBooks', 'nearbyCount',
  'exchanges', 'incomingRequests', 'incomingCount',
  'notifications', 'notificationPreferences',
  'messages',
  'browse',
  'wishlist',
  'ratings', 'userRatings',
  'profile', 'publicProfile',
] as const;

/** Only show "back online" toast if device was offline for longer than this. */
const OFFLINE_TOAST_THRESHOLD_MS = 10_000;

export function useNetworkStatus() {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);
  const previousConnectedRef = useRef<boolean | null>(null);
  const wentOfflineAtRef = useRef<number | null>(null);

  const invalidateStale = useCallback(() => {
    for (const key of STALE_QUERY_KEYS) {
      void queryClient.invalidateQueries({ queryKey: [key] });
    }
  }, [queryClient]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
      setIsConnected(online);
      setIsInternetReachable(online);

      const handleOnline = () => {
        setIsConnected(true);
        setIsInternetReachable(true);
        invalidateStale();
        const offlineDuration = wentOfflineAtRef.current
          ? Date.now() - wentOfflineAtRef.current
          : 0;
        if (offlineDuration >= OFFLINE_TOAST_THRESHOLD_MS) {
          showSuccessToast(i18n.t('network.backOnline'));
        }
        wentOfflineAtRef.current = null;
      };
      const handleOffline = () => {
        setIsConnected(false);
        setIsInternetReachable(false);
        wentOfflineAtRef.current = Date.now();
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    const unsubscribe = NetInfo.addEventListener((state) => {
      const next = netinfoIndicatesOnline(state);
      setIsConnected(state.isConnected);
      setIsInternetReachable(state.isInternetReachable);

      if (previousConnectedRef.current === null) {
        previousConnectedRef.current = !!next;
        return;
      }

      if (previousConnectedRef.current && !next) {
        wentOfflineAtRef.current = Date.now();
      }

      if (!previousConnectedRef.current && next) {
        invalidateStale();
        const offlineDuration = wentOfflineAtRef.current
          ? Date.now() - wentOfflineAtRef.current
          : 0;
        if (offlineDuration >= OFFLINE_TOAST_THRESHOLD_MS) {
          showSuccessToast(i18n.t('network.backOnline'));
        }
        wentOfflineAtRef.current = null;
      }
      previousConnectedRef.current = !!next;
    });

    return () => {
      unsubscribe();
    };
  }, [invalidateStale]);

  const offline = computeIsOffline(isConnected, isInternetReachable);

  return {
    isConnected,
    isInternetReachable,
    isOffline: offline,
  };
}
