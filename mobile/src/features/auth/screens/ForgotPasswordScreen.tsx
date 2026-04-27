import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react-native';

import type { AuthStackParamList } from '@/navigation/types';
import { useColors } from '@/hooks/useColors';
import { spacing, typography } from '@/constants/theme';
import { showErrorToast } from '@/components/Toast';

import {
  createForgotPasswordSchema,
  type ForgotPasswordInput,
} from '../schemas/auth.schemas';
import { useForgotPassword } from '../hooks/useForgotPassword';
import { AuthScreenWrapper } from '../components/AuthScreenWrapper';
import { AuthInput } from '../components/AuthInput';
import { AuthButton } from '../components/AuthButton';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const c = useColors();
  const nav = useNavigation<Nav>();
  const forgotPassword = useForgotPassword();
  const [sent, setSent] = useState(false);

  const schema = useMemo(() => createForgotPasswordSchema(t), [t]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = useCallback(
    (data: ForgotPasswordInput) => {
      forgotPassword.mutate(data, {
        onSuccess: () => setSent(true),
        onError: (err) => {
          const ax = err as { response?: { data?: { detail?: string } } };
          const msg = ax.response?.data?.detail ?? t('common.error');
          showErrorToast(String(msg));
        },
      });
    },
    [forgotPassword, t],
  );

  const handleSendAnother = useCallback(() => {
    setSent(false);
    reset();
  }, [reset]);

  if (sent) {
    return (
      <AuthScreenWrapper centered>
        <View style={s.sentCard}>
          <View style={[s.iconCircle, { backgroundColor: c.auth.bgGlass }]}>
            <CheckCircle size={40} color={c.auth.golden} />
          </View>
          <Text style={[s.sentTitle, { color: c.auth.cream }]}>
            {t('auth.resetSentTitle')}
          </Text>
          <Text style={[s.sentBody, { color: c.auth.textMuted }]}>
            {t('auth.resetSent')}
          </Text>

          <AuthButton
            label={t('auth.backToLogin')}
            onPress={() => nav.navigate('Login')}
          />
          <AuthButton
            label={t('auth.sendAnother')}
            onPress={handleSendAnother}
            variant="outline"
          />
        </View>
      </AuthScreenWrapper>
    );
  }

  return (
    <AuthScreenWrapper centered>
      <Pressable
        onPress={() => nav.goBack()}
        style={s.backBtn}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
      >
        <ArrowLeft size={20} color={c.auth.textMuted} />
        <Text style={[s.backText, { color: c.auth.textMuted }]}>
          {t('common.back')}
        </Text>
      </Pressable>

      <View style={s.header}>
        <Text style={[s.title, { color: c.auth.cream }]}>
          {t('auth.forgotPasswordTitle')}
        </Text>
        <Text style={[s.hint, { color: c.auth.textMuted }]}>
          {t('auth.resetHint')}
        </Text>
      </View>

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value, ref } }) => (
          <AuthInput
            ref={ref}
            icon={Mail}
            placeholder={t('auth.email')}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.email?.message}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            returnKeyType="go"
            onSubmitEditing={handleSubmit(onSubmit)}
          />
        )}
      />

      <AuthButton
        label={t('auth.sendResetLink')}
        onPress={handleSubmit(onSubmit)}
        loading={forgotPassword.isPending}
      />

      <Pressable onPress={() => nav.navigate('Login')} style={s.footer} hitSlop={12}>
        <Text style={[s.footerText, { color: c.auth.textMuted }]}>
          {t('auth.hasAccountPrompt')}{' '}
          <Text style={{ color: c.auth.golden, fontWeight: '700', textDecorationLine: 'underline' }}>
            {t('auth.login')}
          </Text>
        </Text>
      </Pressable>
    </AuthScreenWrapper>
  );
}

const s = StyleSheet.create({
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    marginBottom: spacing.xl,
    paddingVertical: spacing.xs,
  },
  backText: {
    ...typography.body,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  hint: {
    ...typography.body,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  footerText: {
    ...typography.body,
  },
  sentCard: {
    alignItems: 'center',
    width: '100%',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sentTitle: {
    ...typography.title,
    fontSize: 24,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  sentBody: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.xl,
    maxWidth: 280,
  },
});
