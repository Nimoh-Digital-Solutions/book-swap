import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useIsDark } from '@/hooks/useColors';
import { radius } from '@/constants/theme';
import type { ExchangeStatus } from '@/types';

interface Props {
  status: ExchangeStatus;
}

function badgeColors(status: ExchangeStatus, isDark: boolean) {
  const alpha = isDark ? '20' : '15';
  switch (status) {
    case 'pending':
      return { bg: `#F59E0B${alpha}`, text: isDark ? '#FBBF24' : '#B45309' };
    case 'accepted':
    case 'conditions_pending':
    case 'active':
      return { bg: `#3B82F6${alpha}`, text: isDark ? '#60A5FA' : '#1D4ED8' };
    case 'swap_confirmed':
    case 'completed':
    case 'returned':
      return { bg: `#10B981${alpha}`, text: isDark ? '#34D399' : '#047857' };
    case 'declined':
    case 'cancelled':
    case 'expired':
      return { bg: `#EF4444${alpha}`, text: isDark ? '#F87171' : '#B91C1C' };
    case 'return_requested':
      return { bg: `#8B5CF6${alpha}`, text: isDark ? '#A78BFA' : '#6D28D9' };
    default:
      return { bg: `#6B7280${alpha}`, text: isDark ? '#9CA3AF' : '#4B5563' };
  }
}

export function ExchangeStatusBadge({ status }: Props) {
  const { t } = useTranslation();
  const isDark = useIsDark();
  const colors = badgeColors(status, isDark);

  return (
    <View style={[s.badge, { backgroundColor: colors.bg }]}>
      <Text style={[s.label, { color: colors.text }]}>
        {t(`exchanges.status.${status}`, { defaultValue: status })}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
