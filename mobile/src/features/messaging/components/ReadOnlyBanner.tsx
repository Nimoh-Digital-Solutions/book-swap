import { Lock } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { spacing } from '@/constants/theme';
import { useColors, useIsDark } from '@/hooks/useColors';

export function ReadOnlyBanner() {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();

  return (
    <View style={[s.banner, { backgroundColor: isDark ? c.auth.cardBorder + '50' : c.neutral[100] }]}>
      <Lock size={12} color={c.text.secondary} />
      <Text style={[s.text, { color: c.text.secondary }]}>
        {t('messaging.readOnly', 'This chat is now read-only')}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  text: {
    fontSize: 12,
  },
});
