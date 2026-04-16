import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ArrowLeftRight, BookOpen, ChevronRight, Star } from 'lucide-react-native';

import { useColors, useIsDark } from '@/hooks/useColors';
import { spacing, radius, shadows } from '@/constants/theme';

interface Props {
  bookCount?: number;
  communityLabel: string;
  communityTitle: string;
  booksAvailableLabel: string;
  swapsThisWeekLabel: string;
  browseMapLabel: string;
  onBrowseMap: () => void;
}

export function HomeCommunitySection({
  bookCount,
  communityLabel,
  communityTitle,
  booksAvailableLabel,
  swapsThisWeekLabel,
  browseMapLabel,
  onBrowseMap,
}: Props) {
  const c = useColors();
  const isDark = useIsDark();

  return (
    <View style={s.section}>
      {/* Header */}
      <View style={s.header}>
        <Text style={[s.label, { color: c.auth.golden }]}>{communityLabel}</Text>
        <Text style={[s.title, { color: c.text.primary }]}>{communityTitle}</Text>
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        <View style={[s.statCard, { backgroundColor: c.auth.bg, borderColor: c.auth.cardBorder }]}>
          <Text style={[s.statValue, { color: c.auth.golden }]}>
            {bookCount?.toLocaleString() ?? '—'}
          </Text>
          <Text style={[s.statLabel, { color: c.auth.textMuted }]}>{booksAvailableLabel}</Text>
        </View>
        <View style={[s.statCard, { backgroundColor: c.auth.bg, borderColor: c.auth.cardBorder }]}>
          <Text style={[s.statValue, { color: c.auth.golden }]}>852</Text>
          <Text style={[s.statLabel, { color: c.auth.textMuted }]}>{swapsThisWeekLabel}</Text>
        </View>
      </View>

      {/* Activity Feed */}
      <View style={[s.activityCard, { backgroundColor: isDark ? c.auth.card : c.surface.white, borderColor: isDark ? c.auth.cardBorder : c.border.default }]}>
        {[
          {
            icon: BookOpen,
            text: (
              <Text style={[s.activityText, { color: c.text.secondary }]}>
                <Text style={{ color: isDark ? c.auth.golden : c.auth.bg, fontWeight: '700' }}>Emma</Text>
                {' listed '}
                <Text style={{ fontStyle: 'italic' }}>Dune</Text>
                {' in De Pijp.'}
              </Text>
            ),
          },
          {
            icon: ArrowLeftRight,
            text: (
              <Text style={[s.activityText, { color: c.text.secondary }]}>
                <Text style={{ color: isDark ? c.auth.golden : c.auth.bg, fontWeight: '700' }}>Liam</Text>
                {' & '}
                <Text style={{ color: isDark ? c.auth.golden : c.auth.bg, fontWeight: '700' }}>Noah</Text>
                {' just swapped books!'}
              </Text>
            ),
          },
          {
            icon: Star,
            text: (
              <Text style={[s.activityText, { color: c.text.secondary }]}>
                New BookDrop location added in Jordaan.
              </Text>
            ),
          },
        ].map((item, i) => (
          <View
            key={i}
            style={[s.activityRow, i > 0 && { borderTopWidth: 1, borderTopColor: isDark ? c.auth.cardBorder : c.border.default }]}
          >
            <View style={[s.activityIcon, { backgroundColor: c.auth.bg }]}>
              <item.icon size={16} color={c.auth.golden} />
            </View>
            {item.text}
          </View>
        ))}
      </View>

      {/* Browse Map CTA */}
      <Pressable
        style={({ pressed }) => [s.mapCta, { backgroundColor: c.auth.bg, opacity: pressed ? 0.9 : 1 }]}
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
  statLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },

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
