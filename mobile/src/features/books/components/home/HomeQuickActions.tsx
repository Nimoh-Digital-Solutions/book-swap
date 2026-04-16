import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { useColors, useIsDark } from '@/hooks/useColors';
import { spacing, radius, shadows } from '@/constants/theme';

export interface QuickAction {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
}

interface Props {
  actions: QuickAction[];
}

export function HomeQuickActions({ actions }: Props) {
  const c = useColors();
  const isDark = useIsDark();

  return (
    <View style={s.row}>
      {actions.map((action) => (
        <Pressable
          key={action.label}
          style={({ pressed }) => [
            s.action,
            {
              backgroundColor: isDark ? c.auth.card : c.surface.white,
              borderColor: isDark ? c.auth.cardBorder : c.border.default,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          onPress={action.onPress}
        >
          <View style={[s.icon, { backgroundColor: c.auth.golden + '18' }]}>
            <action.icon size={24} color={c.auth.goldenDark} />
          </View>
          <Text style={[s.label, { color: c.text.primary }]}>{action.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  action: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.sm,
    ...shadows.card,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 12, fontWeight: '600' },
});
