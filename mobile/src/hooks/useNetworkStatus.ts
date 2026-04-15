import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import { showSuccessToast } from '@/components/Toast';
import i18n from '@/lib/i18n';

const STALE_QUERY_KEYS = ['books', 'exchanges', 'notifications', 'messages', 'browse'] as const;

export function useNetworkStatus() {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);
  const previousConnectedRef = useRef<boolean | null>(null);

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
        showSuccessToast(i18n.t('network.backOnline'));
      };
      const handleOffline = () => {
        setIsConnected(false);
        setIsInternetReachable(false);
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    const unsubscribe = NetInfo.addEventListener((state) => {
      const next =
        state.isConnected === true &&
        (state.isInternetReachable === true || state.isInternetReachable === null);
      setIsConnected(state.isConnected);
      setIsInternetReachable(state.isInternetReachable);

      if (previousConnectedRef.current === null) {
        previousConnectedRef.current = !!next;
        return;
      }

      if (!previousConnectedRef.current && next) {
        invalidateStale();
        showSuccessToast(i18n.t('network.backOnline'));
      }
      previousConnectedRef.current = !!next;
    });

    return () => {
      unsubscribe();
    };
  }, [invalidateStale]);

  const offline = isConnected === false || isInternetReachable === false;

  return {
    isConnected,
    isInternetReachable,
    isOffline: offline,
  };
}
