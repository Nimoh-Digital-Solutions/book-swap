import { MessageCircle } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { radius, spacing } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

interface Props {
  label: string;
  onPress: () => void;
}

export function DetailChatCTA({ label, onPress }: Props) {
  const c = useColors();
  const accent = c.auth.golden;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.btn, { backgroundColor: accent, opacity: pressed ? 0.9 : 1 }]}
    >
      <MessageCircle size={18} color="#fff" />
      <Text style={s.text}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingVertical: 14,
    borderRadius: radius.xl,
  },
  text: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
