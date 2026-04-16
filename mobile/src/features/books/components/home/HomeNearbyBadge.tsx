import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { useColors } from '@/hooks/useColors';
import { spacing, radius } from '@/constants/theme';

interface Props {
  userCount?: number;
  city: string;
  label: string;
}

export function HomeNearbyBadge({ userCount, city, label }: Props) {
  const c = useColors();

  return (
    <View style={s.wrap}>
      <View style={[s.badge, { backgroundColor: c.auth.bg, borderColor: c.auth.cardBorder }]}>
        <View style={[s.pulseDot, { backgroundColor: c.auth.golden }]} />
        {userCount != null ? (
          <Text style={[s.badgeText, { color: c.auth.golden }]}>
            {userCount.toLocaleString()} {label}
            {city ? ` in ${city}` : ''}
          </Text>
        ) : (
          <View style={[s.skeleton, { backgroundColor: c.auth.cardBorder }]} />
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, marginBottom: spacing.lg },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  pulseDot: { width: 8, height: 8, borderRadius: 4 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  skeleton: { width: 160, height: 12, borderRadius: 6 },
});
