import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { mergePartialUser } from '@/lib/mergeUser';
import { env } from '@/configs/env';
import { showErrorToast } from '@/components/Toast';
import { socialAuthApi } from '../api/socialAuth.api';
import { authApi } from '../api/auth.api';

type GoogleSignInModule = typeof import('@react-native-google-signin/google-signin');

export function useGoogleSignIn() {
  const { t } = useTranslation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setUser = useAuthStore((s) => s.setUser);

  const [loading, setLoading] = useState(false);
  const configuredRef = useRef(false);
  const moduleRef = useRef<GoogleSignInModule | null>(null);

  const getModule = useCallback(() => {
    if (!moduleRef.current) {
      moduleRef.current = require('@react-native-google-signin/google-signin') as GoogleSignInModule;
    }
    return moduleRef.current;
  }, []);

  const configure = useCallback(() => {
    if (configuredRef.current) return;
    const { GoogleSignin } = getModule();
    GoogleSignin.configure({
      webClientId: env.googleWebClientId,
      iosClientId: env.googleIosClientId || undefined,
      offlineAccess: false,
    });
    configuredRef.current = true;
  }, [getModule]);

  const signIn = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!env.googleWebClientId) {
      showErrorToast(t('socialAuth.notConfigured'));
      return { success: false, error: 'not_configured' };
    }

    setLoading(true);
    try {
      configure();
      const { GoogleSignin, isErrorWithCode, statusCodes } = getModule();

      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();

      const idToken = response.data?.idToken;
      if (!idToken) {
        showErrorToast(t('socialAuth.unknownError'));
        return { success: false, error: 'no_id_token' };
      }

      const data = await socialAuthApi.googleSignIn(idToken);

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
      console.error('[GoogleSignIn] Error:', error);
      const { isErrorWithCode, statusCodes } = getModule();

      if (isErrorWithCode(error)) {
        console.error('[GoogleSignIn] Code:', error.code, 'Message:', error.message);
        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
          return { success: false, error: 'cancelled' };
        }
        if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          showErrorToast(t('socialAuth.playServicesError'));
          return { success: false, error: 'play_services' };
        }
      }

      const axiosError = error as { response?: { data?: { detail?: string } } };
      const detail = axiosError.response?.data?.detail;
      showErrorToast(detail ?? t('socialAuth.unknownError'));
      return { success: false, error: detail ?? 'unknown' };
    } finally {
      setLoading(false);
    }
  }, [configure, getModule, setAuth, setUser, t]);

  return { signIn, loading };
}
