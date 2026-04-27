import { useEffect } from 'react';
import { Alert } from 'react-native';
import * as Linking from 'expo-linking';
import { useTranslation } from 'react-i18next';

import { http } from '@/services/http';
import { API } from '@/configs/apiEndpoints';
import { deletionStorage } from '@/lib/storage';

export function useDeletionCancelDeepLink() {
  const { t } = useTranslation();

  useEffect(() => {
    let cancelled = false;

    const handleUrl = async ({ url }: { url: string }) => {
      try {
        const parsed = Linking.parse(url);
        if (parsed.path !== 'account/cancel-deletion') return;

        const token =
          parsed.queryParams?.token as string | undefined;
        if (!token) return;

        await http.post(API.users.meDeleteCancel, { token });
        if (cancelled) return;
        deletionStorage.clearCancelToken();

        Alert.alert(
          t('accountDeletion.cancelledTitle', 'Deletion Cancelled'),
          t(
            'accountDeletion.cancelledMessage',
            'Your account has been restored. You can log in again.',
          ),
        );
      } catch {
        if (cancelled) return;
        Alert.alert(
          t('common.error', 'Error'),
          t(
            'accountDeletion.cancelError',
            'Could not cancel deletion. The link may have expired.',
          ),
        );
      }
    };

    const subscription = Linking.addEventListener('url', handleUrl);

    Linking.getInitialURL().then((url) => {
      if (!cancelled && url) handleUrl({ url });
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [t]);
}
