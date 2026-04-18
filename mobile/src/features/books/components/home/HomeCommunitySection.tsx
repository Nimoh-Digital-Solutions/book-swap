import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ArrowLeftRight, BookOpen, ChevronRight, Star } from 'lucide-react-native';

import { useColors, useIsDark } from '@/hooks/useColors';
import { spacing, radius, shadows } from '@/constants/theme';
import type { ActivityFeedItem } from '../../hooks/useBooks';

interface Props {
  bookCount?: number;
  swapsThisWeek?: number;
  activityFeed?: ActivityFeedItem[];
  communityLabel: string;
  communityTitle: string;
  booksAvailableLabel: string;
  swapsThisWeekLabel: string;
  browseMapLabel: string;
  onBrowseMap: () => void;
}

const FEED_ICONS: Record<ActivityFeedItem['type'], typeof BookOpen> = {
  new_listing: BookOpen,
  completed_swap: ArrowLeftRight,
  new_rating: Star,
};

function FeedItemText({ item, accent, textColor }: { item: ActivityFeedItem; accent: string; textColor: string }) {
  const nameStyle = { color: accent, fontWeight: '700' as const };

  if (item.type === 'new_listing') {
    const location = item.neighbourhood ? ` in ${item.neighbourhood}` : '';
    return (
      <Text style={[s.activityText, { color: textColor }]}>
        <Text style={nameStyle}>{item.user_name}</Text>
        {' listed '}
        {item.book_title ? <Text style={{ fontStyle: 'italic' }}>{item.book_title}</Text> : 'a book'}
        {location}.
      </Text>
    );
  }

  if (item.type === 'completed_swap') {
    return (
      <Text style={[s.activityText, { color: textColor }]}>
        <Text style={nameStyle}>{item.user_name}</Text>
        {' & '}
        <Text style={nameStyle}>{item.partner_name}</Text>
        {' just swapped books!'}
      </Text>
    );
  }

  const stars = item.score ? ` ${'★'.repeat(item.score)}` : '';
  return (
    <Text style={[s.activityText, { color: textColor }]}>
      <Text style={nameStyle}>{item.user_name}</Text>
      {' rated '}
      <Text style={nameStyle}>{item.partner_name}</Text>
      {stars}
    </Text>
  );
}

export function HomeCommunitySection({
  bookCount,
  swapsThisWeek,
  activityFeed,
  communityLabel,
  communityTitle,
  booksAvailableLabel,
  swapsThisWeekLabel,
  browseMapLabel,
  onBrowseMap,
}: Props) {
  const c = useColors();
  const isDark = useIsDark();

  const statBg = isDark ? c.auth.bg : c.auth.golden + '14';
  const statBorder = isDark ? c.auth.cardBorder : c.auth.golden + '30';
  const statLabel = isDark ? c.auth.textMuted : c.text.secondary;
  const iconBg = isDark ? c.auth.bg : c.auth.golden + '14';
  const ctaBg = isDark ? c.auth.bg : c.auth.golden + '14';
  const accent = isDark ? c.auth.golden : c.auth.goldenDark;

  return (
    <View style={s.section}>
      <View style={s.header}>
        <Text style={[s.label, { color: c.auth.golden }]}>{communityLabel}</Text>
        <Text style={[s.title, { color: c.text.primary }]}>{communityTitle}</Text>
      </View>

      <View style={s.statsRow}>
        <View style={[s.statCard, { backgroundColor: statBg, borderColor: statBorder }]}>
          <Text style={[s.statValue, { color: c.auth.golden }]}>
            {bookCount?.toLocaleString() ?? '—'}
          </Text>
          <Text style={[s.statLabelText, { color: statLabel }]}>{booksAvailableLabel}</Text>
        </View>
        <View style={[s.statCard, { backgroundColor: statBg, borderColor: statBorder }]}>
          <Text style={[s.statValue, { color: c.auth.golden }]}>
            {swapsThisWeek?.toLocaleString() ?? '—'}
          </Text>
          <Text style={[s.statLabelText, { color: statLabel }]}>{swapsThisWeekLabel}</Text>
        </View>
      </View>

      {activityFeed && activityFeed.length > 0 && (
        <View style={[s.activityCard, { backgroundColor: isDark ? c.auth.card : c.surface.white, borderColor: isDark ? c.auth.cardBorder : c.border.default }]}>
          {activityFeed.map((item, i) => {
            const Icon = FEED_ICONS[item.type];
            return (
              <View
                key={`${item.type}-${item.timestamp}-${i}`}
                style={[s.activityRow, i > 0 && { borderTopWidth: 1, borderTopColor: isDark ? c.auth.cardBorder : c.border.default }]}
              >
                <View style={[s.activityIcon, { backgroundColor: iconBg }]}>
                  <Icon size={16} color={c.auth.golden} />
                </View>
                <FeedItemText item={item} accent={accent} textColor={c.text.secondary} />
              </View>
            );
          })}
        </View>
      )}

      <Pressable
        style={({ pressed }) => [s.mapCta, { backgroundColor: ctaBg, borderWidth: isDark ? 0 : 1, borderColor: statBorder, opacity: pressed ? 0.9 : 1 }]}
        onPress={onBrowseMap}
      >
        <Text style={[s.mapCtaText, { color: c.auth.golden }]}>{browseMapLabel}</Text>
        <ChevronRight size={18} color={c.auth.golden} />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  section: { marginBottom: spacing.xl },
  header: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 4 },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },

  statsRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  statCard: {
    flex: 1,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  statValue: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  statLabelText: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },

  activityCard: {
    marginHorizontal: spacing.lg,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    padding: spacing.md,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  activityText: { fontSize: 13, flex: 1, lineHeight: 18 },

  mapCta: {
    marginHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 16,
    borderRadius: radius.xl,
  },
  mapCtaText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
});
