import { Image } from 'expo-image';
import { ArrowRight } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { radius, shadows, spacing } from '@/constants/theme';
import { useColors, useIsDark } from '@/hooks/useColors';
import type { ExchangeBook } from '@/types';

const COVER_COLORS = ['#2D5F3F', '#3B4F7A', '#6B3A5E', '#7A5C2E', '#2B4E5F'];

interface Props {
  requestedBook: ExchangeBook;
  originalOfferedBook: ExchangeBook;
}

function MiniPanel({ book }: { book: ExchangeBook }) {
  const c = useColors();
  const coverUri = book.cover_url || book.primary_photo;
  const coverBg = COVER_COLORS[book.id.charCodeAt(0) % COVER_COLORS.length];

  return (
    <View style={s.miniWrap}>
      <View style={[s.miniThumb, { backgroundColor: coverBg }]}>
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={s.miniImage} contentFit="cover" />
        ) : (
          <Text style={s.miniFallback} numberOfLines={1}>{book.title}</Text>
        )}
      </View>
      <Text style={[s.miniTitle, { color: c.text.primary }]} numberOfLines={1}>
        {book.title}
      </Text>
    </View>
  );
}

export function DetailOriginalBooksRow({ requestedBook, originalOfferedBook }: Props) {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const mutedText = c.text.placeholder;
  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;

  return (
    <View style={s.container}>
      <View style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <Text style={[s.label, { color: mutedText }]}>
          {t('exchanges.originalOffer', 'Original offer')}
        </Text>
        <View style={s.row}>
          <MiniPanel book={requestedBook} />
          <ArrowRight size={12} color={mutedText} style={s.arrow} />
          <MiniPanel book={originalOfferedBook} />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    ...shadows.card,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  arrow: {
    marginHorizontal: spacing.xs,
    marginTop: 18,
  },
  miniWrap: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  miniThumb: {
    width: 36,
    height: 48,
    borderRadius: radius.sm,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniImage: {
    width: '100%',
    height: '100%',
  },
  miniFallback: {
    fontSize: 7,
    fontWeight: '600',
    textAlign: 'center',
    color: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 2,
  },
  miniTitle: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
});
