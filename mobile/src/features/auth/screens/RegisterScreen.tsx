import React, { useCallback, useMemo, useRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, AtSign, Mail, Lock, Check, CheckCircle2, XCircle } from 'lucide-react-native';

import type { AuthStackParamList } from '@/navigation/types';
import { useColors } from '@/hooks/useColors';
import { spacing, typography, radius } from '@/constants/theme';
import { ANIMATION } from '@/constants/animation';
import { showErrorToast, showSuccessToast } from '@/components/Toast';
import { useCheckUsername } from '@/features/profile/hooks/useProfile';

import { createRegisterSchema, type RegisterInput } from '../schemas/auth.schemas';
import { useRegister } from '../hooks/useRegister';
import { AuthScreenWrapper } from '../components/AuthScreenWrapper';
import { AuthLogo } from '../components/AuthLogo';
import { AuthInput } from '../components/AuthInput';
import { AuthButton } from '../components/AuthButton';
import { SocialAuthSection } from '../components/SocialAuthSection';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export function RegisterScreen() {
  const { t } = useTranslation();
  const c = useColors();
  const nav = useNavigation<Nav>();
  const register = useRegister();

  const lastNameRef = useRef<TextInput>(null);
  const usernameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const schema = useMemo(() => createRegisterSchema(t), [t]);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: '',
      last_name: '',
      username: '',
      email: '',
      password: '',
      password_confirm: '',
      terms_accepted: false as unknown as true,
    },
  });

  const watchedUsername = watch('username');
  const { data: usernameCheck, isLoading: isCheckingUsername } = useCheckUsername(watchedUsername);
  const usernameTaken = !!(watchedUsername.length >= 3 && usernameCheck && !usernameCheck.available);

  const usernameStatusIcon = (() => {
    if (watchedUsername.trim().length < 3) return null;
    if (isCheckingUsername) return <ActivityIndicator size="small" color={c.auth.textMuted} />;
    if (usernameCheck?.available) return <CheckCircle2 size={18} color={c.status.success} />;
    if (usernameCheck && !usernameCheck.available) return <XCircle size={18} color={c.status.error} />;
    return null;
  })();

  const onSubmit = useCallback(
    (data: RegisterInput) => {
      register.mutate(data, {
        onSuccess: () => {
          showSuccessToast(t('auth.registerSuccess'));
          nav.navigate('EmailVerifyPending', { email: data.email });
        },
        onError: (err) => {
          const ax = err as { response?: { data?: Record<string, unknown> } };
          const raw = ax.response?.data;
          const msg =
            typeof raw?.detail === 'string'
              ? raw.detail
              : raw
                ? Object.values(raw).flat().join('. ')
                : t('common.error');
          showErrorToast(String(msg));
        },
      });
    },
    [register, nav, t],
  );

  return (
    <AuthScreenWrapper>
      <Animated.View entering={FadeIn.duration(400)} style={s.hero}>
        <AuthLogo size="md" />
        <Text style={[s.title, { color: c.auth.cream }]}>
          {t('auth.createAccount')}
        </Text>
        <Text style={[s.subtitle, { color: c.auth.textMuted }]}>
          {t('auth.registerSubtitle')}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(250).delay(ANIMATION.stagger.normal * 0)} style={s.nameRow}>
        <View style={s.nameCol}>
          <Controller
            control={control}
            name="first_name"
            render={({ field: { onChange, onBlur, value, ref } }) => (
              <AuthInput
                ref={ref}
                icon={User}
                placeholder={t('auth.firstName')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.first_name?.message}
                autoCapitalize="words"
                textContentType="givenName"
                autoComplete="name-given"
                returnKeyType="next"
                onSubmitEditing={() => lastNameRef.current?.focus()}
              />
            )}
          />
        </View>
        <View style={s.nameCol}>
          <Controller
            control={control}
            name="last_name"
            render={({ field: { onChange, onBlur, value } }) => (
              <AuthInput
                ref={lastNameRef}
                icon={User}
                placeholder={t('auth.lastName')}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.last_name?.message}
                autoCapitalize="words"
                textContentType="familyName"
                autoComplete="name-family"
                returnKeyType="next"
                onSubmitEditing={() => usernameRef.current?.focus()}
              />
            )}
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(250).delay(ANIMATION.stagger.normal * 1)}>
      <Controller
        control={control}
        name="username"
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthInput
            ref={usernameRef}
            icon={AtSign}
            placeholder={t('auth.username')}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={usernameTaken ? t('profile.edit.usernameTaken') : errors.username?.message}
            rightIcon={usernameStatusIcon}
            autoCapitalize="none"
            textContentType="username"
            autoComplete="username-new"
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
          />
        )}
      />
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(250).delay(ANIMATION.stagger.normal * 2)}>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthInput
            ref={emailRef}
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
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
        )}
      />
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(250).delay(ANIMATION.stagger.normal * 3)}>
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthInput
            ref={passwordRef}
            icon={Lock}
            placeholder={t('auth.password')}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.password?.message}
            secureTextEntry
            textContentType="newPassword"
            autoComplete="new-password"
            returnKeyType="next"
            onSubmitEditing={() => confirmRef.current?.focus()}
          />
        )}
      />
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(250).delay(ANIMATION.stagger.normal * 4)}>
      <Controller
        control={control}
        name="password_confirm"
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthInput
            ref={confirmRef}
            icon={Lock}
            placeholder={t('auth.confirmPassword')}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.password_confirm?.message}
            secureTextEntry
            textContentType="newPassword"
            autoComplete="new-password"
            returnKeyType="go"
            onSubmitEditing={handleSubmit(onSubmit)}
          />
        )}
      />
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(250).delay(ANIMATION.stagger.normal * 5)}>
      <Controller
        control={control}
        name="terms_accepted"
        render={({ field: { onChange, value } }) => (
          <View style={s.termsField}>
            <Pressable
              onPress={() => onChange(!value)}
              style={s.termsRow}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: value === true }}
              hitSlop={8}
            >
              <View
                style={[
                  s.checkbox,
                  {
                    borderColor: errors.terms_accepted
                      ? c.status.error
                      : value
                        ? c.auth.golden
                        : c.auth.borderGlass,
                    backgroundColor: value ? c.auth.golden : 'transparent',
                  },
                ]}
              >
                {value === true && <Check size={14} color={c.auth.bg} strokeWidth={3} />}
              </View>
              <Text style={[s.termsText, { color: c.auth.textMuted }]}>
                {t('auth.agreeTerms')}
              </Text>
            </Pressable>
            {errors.terms_accepted && (
              <Text style={[s.termsError, { color: c.status.error }]}>
                {t('auth.mustAcceptTerms')}
              </Text>
            )}
          </View>
        )}
      />
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(250).delay(ANIMATION.stagger.normal * 6)}>
        <AuthButton
          label={t('auth.register')}
          onPress={handleSubmit(onSubmit)}
          loading={register.isPending}
          disabled={usernameTaken}
        />
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(200).delay(ANIMATION.stagger.normal * 7 + 60)}>
        <SocialAuthSection />
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(200).delay(ANIMATION.stagger.normal * 8 + 60)}>
        <Pressable
          onPress={() => nav.navigate('Login')}
          style={s.footer}
          hitSlop={12}
          accessibilityRole="link"
          accessibilityLabel={`${t('auth.hasAccountPrompt')} ${t('auth.login')}`}
        >
          <Text style={[s.footerText, { color: c.auth.textMuted }]}>
            {t('auth.hasAccountPrompt')}{' '}
            <Text style={{ color: c.auth.golden, fontWeight: '700', textDecorationLine: 'underline' }}>
              {t('auth.login')}
            </Text>
          </Text>
        </Pressable>
      </Animated.View>
    </AuthScreenWrapper>
  );
}

const s = StyleSheet.create({
  hero: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    fontSize: 24,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    marginTop: spacing.xs,
    textAlign: 'center',
    maxWidth: 280,
  },
  nameRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  nameCol: {
    flex: 1,
  },
  termsField: {
    marginBottom: spacing.lg,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  termsText: {
    ...typography.small,
    flex: 1,
    lineHeight: 18,
  },
  termsError: {
    ...typography.small,
    marginTop: spacing.xs,
    marginLeft: 30,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  footerText: {
    ...typography.body,
  },
});
