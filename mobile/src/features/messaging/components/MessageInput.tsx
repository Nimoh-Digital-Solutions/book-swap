import { Send } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, spacing } from '@/constants/theme';
import { useColors, useIsDark } from '@/hooks/useColors';

const MAX_CHARS = 2000;

interface Props {
  onSend: (content: string) => void;
  onTyping: () => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, onTyping, disabled = false }: Props) {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const accent = c.auth.golden;
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');

  const canSend = text.trim().length > 0 && !disabled;
  const inputBg = isDark ? c.auth.card : c.neutral[100];
  const borderColor = isDark ? c.auth.cardBorder : c.border.default;

  const handleChange = useCallback(
    (val: string) => {
      if (val.length <= MAX_CHARS) {
        setText(val);
        onTyping();
      }
    },
    [onTyping],
  );

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  }, [text, onSend]);

  return (
    <View
      style={[
        s.container,
        {
          borderTopColor: borderColor,
          backgroundColor: isDark ? c.auth.bg : c.neutral[50],
          paddingBottom: Math.max(insets.bottom, spacing.sm + 4),
        },
      ]}
    >
      <TextInput
        style={[
          s.input,
          {
            backgroundColor: inputBg,
            color: c.text.primary,
          },
        ]}
        value={text}
        onChangeText={handleChange}
        placeholder={t('messaging.placeholder', 'Type a message...')}
        placeholderTextColor={c.text.placeholder}
        multiline
        maxLength={MAX_CHARS}
        returnKeyType="send"
        submitBehavior="submit"
        onSubmitEditing={handleSend}
        blurOnSubmit={false}
        editable={!disabled}
      />
      <Pressable
        onPress={handleSend}
        disabled={!canSend}
        style={[
          s.sendBtn,
          { backgroundColor: canSend ? accent : (isDark ? c.auth.card : c.neutral[200]) },
          !canSend && s.sendBtnDisabled,
        ]}
        accessibilityLabel={t('messaging.send', 'Send')}
        accessibilityRole="button"
        hitSlop={8}
      >
        {disabled ? (
          <ActivityIndicator size="small" color="#152018" />
        ) : (
          <Send size={20} color={canSend ? '#152018' : c.text.placeholder} />
        )}
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm + 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: radius.lg + 6,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : spacing.xs + 2,
    fontSize: 15,
    lineHeight: 21,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
