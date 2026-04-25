import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { useAuthStore } from '@/stores/authStore';
import type { RootStackParamList } from '@/navigation/types';

// Hook only navigates to the Auth → EmailVerifyPending route, which sits at
// the root navigator (AUD-M-407 — replaces `useNavigation<any>()`).
type Nav = NavigationProp<RootStackParamList>;

/**
 * Returns a guard function that checks `email_verified` before running an action.
 * If the user hasn't verified, it shows an alert and optionally navigates to the
 * email verification pending screen. If verified, it executes the provided callback.
 */
export function useEmailVerificationGate() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);

  const requireVerified = useCallback(
    (action: () => void) => {
      if (user?.email_verified) {
        action();
        return;
      }

      Alert.alert(
        t('emailGate.title', 'Email not verified'),
        t('emailGate.message', 'Please verify your email address before continuing. Check your inbox for the verification link.'),
        [
          { text: t('common.cancel', 'Cancel'), style: 'cancel' },
          {
            text: t('emailGate.goVerify', 'Verify now'),
            onPress: () =>
              navigation.navigate('Auth', {
                screen: 'EmailVerifyPending',
                params: { email: user?.email },
              }),
          },
        ],
      );
    },
    [user, t, navigation],
  );

  return { requireVerified, isVerified: !!user?.email_verified };
}
