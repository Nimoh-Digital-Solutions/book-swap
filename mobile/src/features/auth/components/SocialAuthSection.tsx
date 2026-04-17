import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '@/hooks/useColors';
import { spacing, typography } from '@/constants/theme';

import { SocialAuthButton } from './SocialAuthButton';
import { AppleAuthButton } from './AppleAuthButton';
import { useGoogleSignIn } from '../hooks/useGoogleSignIn';
import { useAppleSignIn } from '../hooks/useAppleSignIn';

export function SocialAuthSection() {
  const { t } = useTranslation();
  const c = useColors();
  const google = useGoogleSignIn();
  const apple = useAppleSignIn();

  const anyLoading = google.loading || apple.loading;

  return (
    <View style={s.root}>
      <View style={s.dividerRow}>
        <View style={[s.dividerLine, { backgroundColor: c.auth.borderGlass }]} />
        <Text style={[s.dividerText, { color: c.auth.textMuted }]}>
          {t('auth.orContinueWith')}
        </Text>
        <View style={[s.dividerLine, { backgroundColor: c.auth.borderGlass }]} />
      </View>

      <SocialAuthButton
        label={t('socialAuth.continueGoogle')}
        onPress={google.signIn}
        loading={google.loading}
        disabled={anyLoading}
      />

      {apple.isAvailable && (
        <AppleAuthButton
          label={t('socialAuth.continueApple')}
          onPress={apple.signIn}
          loading={apple.loading}
          disabled={anyLoading}
        />
      )}
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
});
