import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Mail, CheckCircle, RefreshCw } from 'lucide-react-native';

import type { AuthStackParamList } from '@/navigation/types';
import { useColors } from '@/hooks/useColors';
import { spacing, typography } from '@/constants/theme';

import { authApi } from '../api/auth.api';
import { AuthScreenWrapper } from '../components/AuthScreenWrapper';
import { AuthLogo } from '../components/AuthLogo';
import { AuthButton } from '../components/AuthButton';

type Route = RouteProp<AuthStackParamList, 'EmailVerifyPending'>;
type Nav = NativeStackNavigationProp<AuthStackParamList, 'EmailVerifyPending'>;

type ResendState = 'idle' | 'sending' | 'sent' | 'error';

export function EmailVerifyPendingScreen() {
  const { t } = useTranslation();
  const c = useColors();
  const nav = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const email = params?.email;
  const [resendState, setResendState] = useState<ResendState>('idle');

  const handleResend = useCallback(async () => {
    setResendState('sending');
    try {
      await authApi.resendVerificationEmail();
      setResendState('sent');
    } catch {
      setResendState('error');
    }
  }, []);

  return (
    <AuthScreenWrapper centered>
      <View style={s.container}>
        <AuthLogo size="md" />

        <View style={[s.iconCircle, { backgroundColor: c.auth.golden + '18' }]}>
          <Mail size={32} color={c.auth.golden} />
        </View>

        <Text style={[s.title, { color: c.auth.cream }]}>
          {t('auth.emailVerify.title', 'Check Your Email')}
        </Text>

        <Text style={[s.body, { color: c.auth.textMuted }]}>
          {t(
            'auth.emailVerify.body',
            "We've sent a verification link to your email. Click the link to activate your account.",
          )}
        </Text>

        {email ? (
          <Text style={[s.email, { color: c.auth.cream }]}>{email}</Text>
        ) : null}

        {resendState === 'sent' ? (
          <View style={s.sentRow}>
            <CheckCircle size={18} color={c.status.success} />
            <Text style={[s.sentText, { color: c.status.success }]}>
              {t('auth.emailVerify.resent', 'Verification email sent!')}
            </Text>
          </View>
        ) : (
          <AuthButton
            label={
              resendState === 'sending'
                ? t('auth.emailVerify.resending', 'Sending...')
                : t('auth.emailVerify.resend', 'Resend Verification Email')
            }
            onPress={handleResend}
            disabled={resendState === 'sending'}
            loading={resendState === 'sending'}
            variant="outline"
          />
        )}

        {resendState === 'error' ? (
          <Text style={[s.errorText, { color: c.status.error }]}>
            {t(
              'auth.emailVerify.resendError',
              'Failed to resend. Try again later.',
            )}
          </Text>
        ) : null}

        <AuthButton
          label={t('auth.emailVerify.signIn', 'Sign In')}
          onPress={() => nav.navigate('Login')}
          variant="outline"
        />
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
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    fontSize: 22,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  body: {
    ...typography.body,
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: spacing.sm,
  },
  email: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: spacing.lg,
  },
  sentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
  },
  sentText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    ...typography.small,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
