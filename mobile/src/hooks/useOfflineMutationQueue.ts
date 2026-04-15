import { useEffect, useRef } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { drainMutationQueue, pendingMutationCount } from '@/lib/offlineMutationQueue';
import { addBreadcrumb } from '@/lib/sentry';
import { showSuccessToast, showErrorToast } from '@/components/Toast';
import { useTranslation } from 'react-i18next';

export function useOfflineMutationDrain() {
  const { isOffline } = useNetworkStatus();
  const { t } = useTranslation();
  const wasOffline = useRef(false);

  useEffect(() => {
    if (isOffline) {
      wasOffline.current = true;
      return;
    }

    if (wasOffline.current) {
      wasOffline.current = false;
      const count = pendingMutationCount();
      if (count === 0) return;

      addBreadcrumb('offline-queue', `Back online with ${count} pending mutations`);

      drainMutationQueue().then(({ succeeded, failed }) => {
        if (succeeded > 0) {
          showSuccessToast(t('common.done'));
        }
        if (failed > 0) {
          showErrorToast(t('common.error'));
        }
      });
    }
  }, [isOffline, t]);
}
