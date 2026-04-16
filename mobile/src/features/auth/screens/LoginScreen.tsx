import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock } from 'lucide-react-native';

import type { AuthStackParamList } from '@/navigation/types';
import { useColors } from '@/hooks/useColors';
import { spacing, typography } from '@/constants/theme';
import { showErrorToast } from '@/components/Toast';
import { tokenStorage } from '@/lib/storage';

import { loginSchema, type LoginInput } from '../schemas/auth.schemas';
import { useLogin } from '../hooks/useLogin';
import { AuthScreenWrapper } from '../components/AuthScreenWrapper';
import { AuthLogo } from '../components/AuthLogo';
import { AuthInput } from '../components/AuthInput';
import { AuthButton } from '../components/AuthButton';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export function LoginScreen() {
  const { t } = useTranslation();
  const c = useColors();
  const nav = useNavigation<Nav>();
  const passwordRef = useRef<TextInput>(null);
  const login = useLogin();
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email_or_username: '', password: '' },
  });

  useEffect(() => {
    void LocalAuthentication.hasHardwareAsync().then((has) => {
      if (has) void LocalAuthentication.isEnrolledAsync().then(setBiometricAvailable);
    });
  }, []);

  const onSubmit = useCallback(
    (data: LoginInput) => {
      login.mutate(data, {
        onError: (err) => {
          const ax = err as { response?: { data?: { detail?: string; message?: string } } };
          const msg =
            ax.response?.data?.detail ??
            ax.response?.data?.message ??
            t('common.error');
          showErrorToast(String(msg));
        },
      });
    },
    [login, t],
  );

  const handleBiometric = useCallback(async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: t('auth.biometricPrompt'),
    });
    if (result.success) {
      const hasTokens = tokenStorage.getAccess() && tokenStorage.getRefresh();
      if (!hasTokens) {
        showErrorToast(t('auth.fillRequired'));
      }
    }
  }, [t]);

  return (
    <AuthScreenWrapper centered>
      <View style={s.hero}>
        <AuthLogo size="lg" showName />
        <Text style={[s.subtitle, { color: c.auth.textMuted }]}>
          {t('auth.loginSubtitle')}
        </Text>
      </View>

      <View style={s.form}>
        <Controller
          control={control}
          name="email_or_username"
          render={({ field: { onChange, onBlur, value, ref } }) => (
            <AuthInput
              ref={ref}
              icon={Mail}
              placeholder={t('auth.emailOrUsername')}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email_or_username?.message}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="username"
              autoComplete="email"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value, ref } }) => (
            <AuthInput
              ref={(el) => {
                if (typeof ref === 'function') ref(el);
                (passwordRef as React.MutableRefObject<TextInput | null>).current = el;
              }}
              icon={Lock}
              placeholder={t('auth.password')}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
              secureTextEntry
              textContentType="password"
              autoComplete="password"
              returnKeyType="go"
              onSubmitEditing={handleSubmit(onSubmit)}
              rightAction={{
                label: t('auth.forgotPassword'),
                onPress: () => nav.navigate('ForgotPassword'),
              }}
            />
          )}
        />

        <AuthButton
          label={t('auth.login')}
          onPress={handleSubmit(onSubmit)}
          loading={login.isPending}
        />

        {biometricAvailable && (
          <AuthButton
            label={t('auth.biometricUnlock')}
            onPress={handleBiometric}
            variant="outline"
          />
        )}
      </View>

      <Pressable onPress={() => nav.navigate('Register')} style={s.footer} hitSlop={12}>
        <Text style={[s.footerText, { color: c.auth.textMuted }]}>
          {t('auth.noAccountPrompt')}{' '}
          <Text style={{ color: c.auth.golden, fontWeight: '700', textDecorationLine: 'underline' }}>
            {t('auth.register')}
          </Text>
        </Text>
      </Pressable>
    </AuthScreenWrapper>
  );
}

const s = StyleSheet.create({
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl + spacing.md,
  },
  subtitle: {
    ...typography.body,
    marginTop: spacing.sm,
    textAlign: 'center',
    maxWidth: 260,
  },
  form: {
    width: '100%',
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  footerText: {
    ...typography.body,
  },
});
