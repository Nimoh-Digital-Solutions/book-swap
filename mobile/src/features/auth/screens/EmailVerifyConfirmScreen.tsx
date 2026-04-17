import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { CheckCircle, AlertCircle } from 'lucide-react-native';

import type { AuthStackParamList } from '@/navigation/types';
import { useColors } from '@/hooks/useColors';
import { spacing, typography } from '@/constants/theme';

import { authApi } from '../api/auth.api';
import { AuthScreenWrapper } from '../components/AuthScreenWrapper';
import { AuthButton } from '../components/AuthButton';

type Route = RouteProp<AuthStackParamList, 'EmailVerifyConfirm'>;
type Nav = NativeStackNavigationProp<AuthStackParamList, 'EmailVerifyConfirm'>;

type VerifyState = 'loading' | 'success' | 'error';

export function EmailVerifyConfirmScreen() {
  const { t } = useTranslation();
  const c = useColors();
  const nav = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { token } = params;

  const [state, setState] = useState<VerifyState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;

    if (!token) {
      setState('error');
      setErrorMessage(
        t(
          'auth.emailVerify.noToken',
          'No verification token found. Please check the link in your email.',
        ),
      );
      return;
    }

    authApi
      .verifyEmail(token)
      .then(() => setState('success'))
      .catch(() => {
        setState('error');
        setErrorMessage(
          t(
            'auth.emailVerify.expired',
            'This verification link is invalid or has expired. Please request a new one.',
          ),
        );
      });
  }, [token, t]);

  return (
    <AuthScreenWrapper centered>
      <View style={s.container}>
        {state === 'loading' && (
          <>
            <ActivityIndicator size="large" color={c.auth.golden} />
            <Text style={[s.title, { color: c.auth.cream }]}>
              {t('auth.emailVerify.verifying', 'Verifying your email...')}
            </Text>
            <Text style={[s.body, { color: c.auth.textMuted }]}>
              {t(
                'auth.emailVerify.pleaseWait',
                'Please wait while we confirm your email address.',
              )}
            </Text>
          </>
        )}

        {state === 'success' && (
          <>
            <View
              style={[
                s.iconCircle,
                { backgroundColor: c.status.success + '20' },
              ]}
            >
              <CheckCircle size={36} color={c.status.success} />
            </View>
            <Text style={[s.title, { color: c.auth.cream }]}>
              {t('auth.emailVerify.success', 'Email Verified!')}
            </Text>
            <Text style={[s.body, { color: c.auth.textMuted }]}>
              {t(
                'auth.emailVerify.successBody',
                'Your email has been verified. You can now list books, request swaps, and message other members.',
              )}
            </Text>
            <AuthButton
              label={t('auth.emailVerify.signIn', 'Sign In')}
              onPress={() => nav.navigate('Login')}
            />
          </>
        )}

        {state === 'error' && (
          <>
            <View
              style={[
                s.iconCircle,
                { backgroundColor: c.status.error + '20' },
              ]}
            >
              <AlertCircle size={36} color={c.status.error} />
            </View>
            <Text style={[s.title, { color: c.auth.cream }]}>
              {t('auth.emailVerify.failed', 'Verification Failed')}
            </Text>
            <Text style={[s.body, { color: c.auth.textMuted }]}>
              {errorMessage}
            </Text>
            <AuthButton
              label={t('auth.emailVerify.signIn', 'Sign In')}
              onPress={() => nav.navigate('Login')}
              variant="outline"
            />
            <AuthButton
              label={t('auth.emailVerify.resend', 'Resend Verification Email')}
              onPress={() => nav.navigate('EmailVerifyPending', {})}
            />
          </>
        )}
      </View>
    </AuthScreenWrapper>
  );
}

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    fontSize: 22,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  body: {
    ...typography.body,
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: spacing.lg,
  },
});
