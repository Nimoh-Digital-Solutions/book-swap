import { ArrowRight } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors, useIsDark } from '@/hooks/useColors';
import { radius, shadows, spacing } from '@/constants/theme';
import type { ExchangeBook, ExchangeListItem } from '@/types';
import { ExchangeStatusBadge } from './ExchangeStatusBadge';

interface Props {
  exchange: ExchangeListItem;
  onPress: () => void;
}

function BookThumb({ book, label }: { book: ExchangeBook; label: string }) {
  const c = useColors();
  const isDark = useIsDark();

  return (
    <View style={s.thumbWrap}>
      <View style={[s.thumb, { backgroundColor: isDark ? c.auth.bgDeep : '#E5E7EB' }]}>
        <Text style={s.thumbTitle} numberOfLines={2}>{book.title}</Text>
      </View>
      <Text style={[s.thumbLabel, { color: c.text.secondary }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function ExchangeCard({ exchange, onPress }: Props) {
  const c = useColors();
  const isDark = useIsDark();

  const partner =
    exchange.requester.username !== exchange.owner.username
      ? `${exchange.requester.username} ↔ ${exchange.owner.username}`
      : exchange.requester.username;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.card,
        {
          backgroundColor: isDark ? c.auth.card : c.surface.white,
          borderColor: isDark ? c.auth.cardBorder : c.border.default,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={s.topRow}>
        <ExchangeStatusBadge status={exchange.status} />
        <Text style={[s.date, { color: c.text.secondary }]}>
          {new Date(exchange.created_at).toLocaleDateString()}
        </Text>
      </View>

      <View style={s.booksRow}>
        <BookThumb book={exchange.requested_book} label="Requested" />
        <ArrowRight size={16} color={c.text.placeholder} style={s.arrow} />
        <BookThumb book={exchange.offered_book} label="Offered" />
      </View>

      <Text style={[s.partner, { color: c.text.secondary }]} numberOfLines={1}>
        {partner}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    ...shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  date: { fontSize: 11 },

  booksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  arrow: { marginHorizontal: spacing.sm },

  thumbWrap: { flex: 1 },
  thumb: {
    height: 72,
    borderRadius: radius.sm,
    padding: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  thumbTitle: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    color: 'rgba(255,255,255,0.85)',
  },
  thumbLabel: { fontSize: 10, fontWeight: '500' },

  partner: { fontSize: 12 },
});
