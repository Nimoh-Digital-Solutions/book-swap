import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useAuthStore } from '@/stores/authStore';
import { mergePartialUser } from '@/lib/mergeUser';
import { showErrorToast } from '@/components/Toast';
import { socialAuthApi } from '../api/socialAuth.api';
import { authApi } from '../api/auth.api';

export function useAppleSignIn() {
  const { t } = useTranslation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setUser = useAuthStore((s) => s.setUser);

  const [loading, setLoading] = useState(false);

  const isAvailable = Platform.OS === 'ios';

  const signIn = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!isAvailable) {
      return { success: false, error: 'unavailable' };
    }

    setLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const identityToken = credential.identityToken;
      if (!identityToken) {
        showErrorToast(t('socialAuth.unknownError'));
        return { success: false, error: 'no_identity_token' };
      }

      const userInfo = credential.email
        ? {
            email: credential.email,
            first_name: credential.fullName?.givenName ?? '',
            last_name: credential.fullName?.familyName ?? '',
          }
        : undefined;

      const data = await socialAuthApi.appleSignIn(identityToken, userInfo);

      await setAuth(
        mergePartialUser(data.user as Parameters<typeof mergePartialUser>[0]),
        data.access_token,
        data.refresh_token,
      );

      try {
        const fullUser = await authApi.getMe();
        await setUser(fullUser);
      } catch {
        // Auth succeeded; getMe can be retried later
      }

      return { success: true };
    } catch (error: unknown) {
      const appleError = error as { code?: string };
      if (appleError.code === 'ERR_REQUEST_CANCELED') {
        return { success: false, error: 'cancelled' };
      }

      const axiosError = error as { response?: { data?: { detail?: string } } };
      const detail = axiosError.response?.data?.detail;
      showErrorToast(detail ?? t('socialAuth.unknownError'));
      return { success: false, error: detail ?? 'unknown' };
    } finally {
      setLoading(false);
    }
  }, [isAvailable, setAuth, setUser, t]);

  return { signIn, loading, isAvailable };
}
