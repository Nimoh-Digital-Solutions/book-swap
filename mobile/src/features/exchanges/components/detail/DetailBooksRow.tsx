import { Image } from 'expo-image';
import { ArrowLeftRight } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '@/constants/theme';
import { useColors, useIsDark } from '@/hooks/useColors';
import type { ExchangeBook } from '@/types';

const COVER_COLORS = ['#2D5F3F', '#3B4F7A', '#6B3A5E', '#7A5C2E', '#2B4E5F'];

interface Props {
  requestedBook: ExchangeBook;
  offeredBook: ExchangeBook;
  requestedLabel: string;
  offeredLabel: string;
}

function BookPanel({ book, label }: { book: ExchangeBook; label: string }) {
  const c = useColors();
  const coverUri = book.cover_url || book.primary_photo;
  const coverBg = COVER_COLORS[book.id.charCodeAt(0) % COVER_COLORS.length];

  return (
    <View style={s.thumbWrap}>
      <View style={[s.thumb, { backgroundColor: coverBg }]}>
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={s.thumbImage} contentFit="cover" />
        ) : (
          <Text style={s.thumbFallback} numberOfLines={2}>{book.title}</Text>
        )}
      </View>
      <Text style={[s.thumbBookTitle, { color: c.text.primary }]} numberOfLines={1}>
        {book.title}
      </Text>
      <Text style={[s.thumbLabel, { color: c.text.secondary }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function DetailBooksRow({ requestedBook, offeredBook, requestedLabel, offeredLabel }: Props) {
  const c = useColors();
  const isDark = useIsDark();
  const accent = c.auth.golden;
  const bg = isDark ? c.auth.bg : c.neutral[50];
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;

  return (
    <View style={s.booksRow}>
      <BookPanel book={requestedBook} label={requestedLabel} />
      <View style={s.arrowWrap}>
        <View style={[s.arrowCircle, { backgroundColor: bg, borderColor: cardBorder }]}>
          <ArrowLeftRight size={14} color={accent} />
        </View>
      </View>
      <BookPanel book={offeredBook} label={offeredLabel} />
    </View>
  );
}

const s = StyleSheet.create({
  booksRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  arrowWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: spacing.xs,
  },
  arrowCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbWrap: {
    flex: 1,
    alignItems: 'center',
  },
  thumb: {
    width: '80%',
    aspectRatio: 0.7,
    borderRadius: radius.sm,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm + 2,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbFallback: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    color: 'rgba(255,255,255,0.85)',
    paddingHorizontal: spacing.xs,
  },
  thumbBookTitle: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  thumbLabel: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 1,
  },
});
