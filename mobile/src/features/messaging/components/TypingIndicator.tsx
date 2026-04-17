import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { spacing } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

interface Props {
  username: string;
}

export function TypingIndicator({ username }: Props) {
  const { t } = useTranslation();
  const c = useColors();

  return (
    <View style={s.container}>
      <Text style={[s.text, { color: c.text.secondary }]}>
        {t('messaging.typing', { defaultValue: '{{name}} is typing...', name: username })}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  text: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});
