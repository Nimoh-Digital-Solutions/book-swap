import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react-native';

import type { AuthStackParamList } from '@/navigation/types';
import { useColors } from '@/hooks/useColors';
import { spacing, typography } from '@/constants/theme';

import {
  createPasswordResetConfirmSchema,
  type PasswordResetConfirmInput,
} from '../schemas/auth.schemas';
import { usePasswordResetConfirm } from '../hooks/usePasswordResetConfirm';
import { AuthScreenWrapper } from '../components/AuthScreenWrapper';
import { AuthInput } from '../components/AuthInput';
import { AuthButton } from '../components/AuthButton';

type Route = RouteProp<AuthStackParamList, 'PasswordResetConfirm'>;
type Nav = NativeStackNavigationProp<AuthStackParamList, 'PasswordResetConfirm'>;

type PageState = 'form' | 'success' | 'invalid_link';

export function PasswordResetConfirmScreen() {
  const { t } = useTranslation();
  const c = useColors();
  const nav = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { uid, token } = params;

  const resetConfirm = usePasswordResetConfirm();
  const [pageState, setPageState] = useState<PageState>(
    uid && token ? 'form' : 'invalid_link',
  );
  const [serverError, setServerError] = useState('');

  const schema = useMemo(() => createPasswordResetConfirmSchema(t), [t]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordResetConfirmInput>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', password_confirm: '' },
  });

  const onSubmit = useCallback(
    (data: PasswordResetConfirmInput) => {
      setServerError('');
      resetConfirm.mutate(
        { uid, token, newPassword: data.password },
        {
          onSuccess: () => setPageState('success'),
          onError: (err) => {
            const ax = err as { response?: { data?: { detail?: string; new_password?: string[] } } };
            const detail =
              ax.response?.data?.detail
              ?? ax.response?.data?.new_password?.[0]
              ?? t('auth.resetConfirm.genericError', 'This reset link is invalid or has expired.');
            setServerError(String(detail));
          },
        },
      );
    },
    [uid, token, resetConfirm, t],
  );

  if (pageState === 'success') {
    return (
      <AuthScreenWrapper centered>
        <View style={s.stateContainer}>
          <View style={[s.iconCircle, { backgroundColor: c.status.success + '20' }]}>
            <CheckCircle size={36} color={c.status.success} />
          </View>
          <Text style={[s.stateTitle, { color: c.auth.cream }]}>
            {t('auth.resetConfirm.successTitle', 'Password Reset!')}
          </Text>
          <Text style={[s.stateBody, { color: c.auth.textMuted }]}>
            {t(
              'auth.resetConfirm.successBody',
              'Your password has been changed successfully. You can now sign in with your new password.',
            )}
          </Text>
          <AuthButton
            label={t('auth.resetConfirm.signIn', 'Sign In')}
            onPress={() => nav.navigate('Login')}
          />
        </View>
      </AuthScreenWrapper>
    );
  }

  if (pageState === 'invalid_link') {
    return (
      <AuthScreenWrapper centered>
        <View style={s.stateContainer}>
          <View style={[s.iconCircle, { backgroundColor: c.status.error + '20' }]}>
            <AlertCircle size={36} color={c.status.error} />
          </View>
          <Text style={[s.stateTitle, { color: c.auth.cream }]}>
            {t('auth.resetConfirm.errorTitle', 'Reset Failed')}
          </Text>
          <Text style={[s.stateBody, { color: c.auth.textMuted }]}>
            {t(
              'auth.resetConfirm.noLink',
              'This password reset link is missing or malformed. Please request a new one.',
            )}
          </Text>
          <AuthButton
            label={t('auth.resetConfirm.signIn', 'Sign In')}
            onPress={() => nav.navigate('Login')}
            variant="outline"
          />
          <AuthButton
            label={t('auth.resetConfirm.requestNew', 'Request New Reset Link')}
            onPress={() => nav.navigate('ForgotPassword')}
          />
        </View>
      </AuthScreenWrapper>
    );
  }

  return (
    <AuthScreenWrapper centered>
      <View style={s.header}>
        <View style={[s.iconCircle, { backgroundColor: c.auth.bgGlass }]}>
          <Lock size={32} color={c.auth.golden} />
        </View>
        <Text style={[s.title, { color: c.auth.cream }]}>
          {t('auth.resetConfirm.title', 'Set New Password')}
        </Text>
        <Text style={[s.hint, { color: c.auth.textMuted }]}>
          {t(
            'auth.resetConfirm.hint',
            'Enter your new password. It must be at least 8 characters with an uppercase letter, a lowercase letter, and a digit.',
          )}
        </Text>
      </View>

      {!!serverError && (
        <Text
          style={[s.inlineError, { color: c.status.error }]}
          accessibilityRole="alert"
        >
          {serverError}
        </Text>
      )}

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value, ref } }) => (
          <AuthInput
            ref={ref}
            icon={Lock}
            placeholder={t('auth.resetConfirm.newPassword', 'New password')}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.password?.message}
            secureTextEntry
            autoCapitalize="none"
            textContentType="newPassword"
            autoComplete="new-password"
            returnKeyType="next"
          />
        )}
      />

      <Controller
        control={control}
        name="password_confirm"
        render={({ field: { onChange, onBlur, value, ref } }) => (
          <AuthInput
            ref={ref}
            icon={Lock}
            placeholder={t('auth.resetConfirm.confirmPassword', 'Confirm new password')}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.password_confirm?.message}
            secureTextEntry
            autoCapitalize="none"
            textContentType="newPassword"
            autoComplete="new-password"
            returnKeyType="go"
            onSubmitEditing={handleSubmit(onSubmit)}
          />
        )}
      />

      <AuthButton
        label={t('auth.resetConfirm.submit', 'Reset Password')}
        onPress={handleSubmit(onSubmit)}
        loading={resetConfirm.isPending}
      />

      <Pressable onPress={() => nav.navigate('Login')} style={s.footer} hitSlop={12}>
        <Text style={[s.footerText, { color: c.auth.textMuted }]}>
          {t('auth.resetConfirm.rememberPassword', 'Remember your password?')}{' '}
          <Text style={{ color: c.auth.golden, fontWeight: '700', textDecorationLine: 'underline' }}>
            {t('auth.login', 'Sign In')}
          </Text>
        </Text>
      </Pressable>
    </AuthScreenWrapper>
  );
}

const s = StyleSheet.create({
  stateContainer: {
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
  stateTitle: {
    ...typography.title,
    fontSize: 22,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  stateBody: {
    ...typography.body,
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: spacing.lg,
  },

  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  hint: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  inlineError: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.md,
    maxWidth: 320,
    alignSelf: 'center',
  },

  footer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  footerText: {
    ...typography.body,
  },
});
