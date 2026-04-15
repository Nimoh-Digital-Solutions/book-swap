import { useCallback, useEffect, useState } from 'react';
import i18n from '@/lib/i18n';

type LocalAuthModule = typeof import('expo-local-authentication');

export function useBiometric() {
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const LocalAuth: LocalAuthModule = await import('expo-local-authentication');
      const hasHardware = await LocalAuth.hasHardwareAsync();
      const enrolled = await LocalAuth.isEnrolledAsync();
      if (!cancelled) setIsBiometricAvailable(hasHardware && enrolled);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const authenticate = useCallback(async () => {
    const LocalAuth: LocalAuthModule = await import('expo-local-authentication');
    return LocalAuth.authenticateAsync({
      promptMessage: i18n.t('auth.biometricPrompt'),
      cancelLabel: i18n.t('common.cancel'),
      disableDeviceFallback: false,
    });
  }, []);

  return { isBiometricAvailable, authenticate };
}
