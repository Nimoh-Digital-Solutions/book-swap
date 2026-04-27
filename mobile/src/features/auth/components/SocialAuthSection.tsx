import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/hooks/useColors';
import { spacing, typography, radius } from '@/constants/theme';
import { useGoogleSignIn } from '../hooks/useGoogleSignIn';
import { useAppleSignIn } from '../hooks/useAppleSignIn';

function GoogleLogo({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <Path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <Path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <Path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </Svg>
  );
}

function AppleLogo({ size = 22, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </Svg>
  );
}

export function SocialAuthSection() {
  const { t } = useTranslation();
  const c = useColors();
  const google = useGoogleSignIn();
  const apple = useAppleSignIn();

  const anyLoading = google.loading || apple.loading;
  const showApple = apple.isAvailable && Platform.OS === 'ios';

  return (
    <View style={s.root}>
      <View style={s.dividerRow}>
        <View style={[s.dividerLine, { backgroundColor: c.auth.borderGlass }]} />
        <Text style={[s.dividerText, { color: c.auth.textMuted }]}>
          {t('auth.orContinueWith')}
        </Text>
        <View style={[s.dividerLine, { backgroundColor: c.auth.borderGlass }]} />
      </View>

      <View style={s.buttonRow}>
        <Pressable
          onPress={google.signIn}
          disabled={anyLoading}
          accessibilityRole="button"
          accessibilityLabel={t('socialAuth.continueGoogle')}
          style={({ pressed }) => [
            s.iconBtn,
            { borderColor: c.auth.borderGlass, backgroundColor: 'rgba(255,255,255,0.06)' },
            !showApple && s.fullWidth,
            anyLoading && s.disabled,
            pressed && s.pressed,
          ]}
        >
          {google.loading ? (
            <ActivityIndicator size="small" color={c.auth.cream} />
          ) : (
            <GoogleLogo />
          )}
        </Pressable>

        {showApple && (
          <Pressable
            onPress={apple.signIn}
            disabled={anyLoading}
            accessibilityRole="button"
            accessibilityLabel={t('socialAuth.continueApple')}
            style={({ pressed }) => [
              s.iconBtn,
              { backgroundColor: '#fff' },
              anyLoading && s.disabled,
              pressed && s.pressed,
            ]}
          >
            {apple.loading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <AppleLogo color="#000" />
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    width: '100%',
    marginTop: spacing.sm,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    ...typography.small,
    marginHorizontal: spacing.md,
    textTransform: 'lowercase',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  iconBtn: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    flex: 0,
    width: '100%',
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
});
