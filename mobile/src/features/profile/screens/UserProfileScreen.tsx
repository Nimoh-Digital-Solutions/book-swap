import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import {
  MapPin,
  Star,
  ArrowLeftRight,
  BookOpen,
  Calendar,
  Globe,
  UserX,
  ShieldAlert,
  Flag,
  MessageSquareQuote,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { useColors, useIsDark } from '@/hooks/useColors';
import { spacing, radius } from '@/constants/theme';
import { usePublicProfile } from '@/features/profile/hooks/usePublicProfile';
import { useUserRatings } from '@/features/ratings/hooks/useRatings';
import { RatingCard } from '@/features/ratings/components/RatingCard';
import { ReportSheet } from '@/features/trust-safety/components/ReportSheet';
import type { HomeStackParamList } from '@/navigation/types';

type Route = RouteProp<HomeStackParamList, 'UserProfile'>;

function StatItem({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Star;
  value: string;
  label: string;
}) {
  const c = useColors();
  return (
    <View style={s.statItem}>
      <Icon size={18} color={c.auth.golden} />
      <Text style={[s.statValue, { color: c.text.primary }]}>{value}</Text>
      <Text style={[s.statLabel, { color: c.text.secondary }]}>{label}</Text>
    </View>
  );
}

function InfoCard({
  icon: Icon,
  title,
  content,
}: {
  icon: typeof MapPin;
  title: string;
  content: string;
}) {
  const c = useColors();
  const isDark = useIsDark();
  if (!content) return null;
  return (
    <View
      style={[
        s.infoCard,
        {
          backgroundColor: isDark ? c.auth.card : c.surface.white,
          borderColor: isDark ? c.auth.cardBorder : c.border.default,
        },
      ]}
    >
      <View style={[s.infoIcon, { backgroundColor: c.auth.golden + '18' }]}>
        <Icon size={18} color={c.auth.golden} />
      </View>
      <View style={s.infoTextWrap}>
        <Text style={[s.infoTitle, { color: c.text.secondary }]}>{title}</Text>
        <Text style={[s.infoContent, { color: c.text.primary }]}>
          {content}
        </Text>
      </View>
    </View>
  );
}

function RecentReviews({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useUserRatings(userId);
  const accent = c.auth.golden;

  const ratings = useMemo(
    () => data?.pages.flatMap((p) => p.results) ?? [],
    [data],
  );

  if (isLoading) {
    return (
      <View style={s.reviewsSection}>
        <Text style={[s.sectionTitle, { color: c.text.primary }]}>
          {t('profile.recentReviews', 'Recent Reviews')}
        </Text>
        <ActivityIndicator
          size="small"
          color={accent}
          style={{ marginTop: spacing.md }}
        />
      </View>
    );
  }

  return (
    <View style={s.reviewsSection}>
      <Text style={[s.sectionTitle, { color: c.text.primary }]}>
        {t('profile.recentReviews', 'Recent Reviews')}
      </Text>
      {ratings.length === 0 ? (
        <EmptyState
          icon={MessageSquareQuote}
          title={t('profile.noReviews', 'No reviews yet')}
          subtitle={t(
            'profile.noReviewsPublic',
            'This user has no reviews yet.',
          )}
          compact
        />
      ) : (
        <View style={s.reviewsList}>
          {ratings.map((r) => (
            <RatingCard key={r.id} rating={r} />
          ))}
          {hasNextPage && (
            <Pressable
              onPress={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              style={({ pressed }) => [
                s.loadMoreBtn,
                {
                  borderColor: isDark
                    ? c.auth.cardBorder
                    : c.border.default,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              {isFetchingNextPage ? (
                <ActivityIndicator size="small" color={accent} />
              ) : (
                <Text style={[s.loadMoreText, { color: accent }]}>
                  {t('profile.loadMore', 'Load more')}
                </Text>
              )}
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

function formatLanguage(lang: string): string {
  const map: Record<string, string> = {
    en: 'English',
    nl: 'Nederlands',
    fr: 'Français',
    both: 'EN / NL',
  };
  return map[lang] ?? lang.toUpperCase();
}

export function UserProfileScreen() {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const { params } = useRoute<Route>();
  const { userId } = params;

  const { data: profile, isLoading, isError } = usePublicProfile(userId);
  const [reportVisible, setReportVisible] = useState(false);

  const bg = isDark ? c.auth.bg : c.neutral[50];
  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;
  const accent = c.auth.golden;

  if (isLoading) {
    return (
      <View style={[s.root, s.center, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color={accent} />
      </View>
    );
  }

  if (isError || !profile) {
    return (
      <View style={[s.root, { backgroundColor: bg }]}>
        <EmptyState
          icon={UserX}
          title={t('profile.public.notFound', 'User not found')}
          subtitle={t(
            'profile.public.deactivated',
            'This user is no longer active.',
          )}
        />
      </View>
    );
  }

  const fullName = profile.first_name || profile.username;
  const memberSinceYear = new Date(profile.member_since).getFullYear();
  const memberSince = isNaN(memberSinceYear) ? '' : String(memberSinceYear);
  const genres =
    profile.preferred_genres?.length > 0
      ? profile.preferred_genres.join(', ')
      : '';

  return (
    <View style={[s.root, { backgroundColor: bg }]}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View style={s.hero}>
          <View style={s.heroAvatarWrap}>
            <Avatar
              uri={profile.avatar}
              name={fullName}
              size={88}
              borderColor={accent}
            />
          </View>
          <Text style={[s.heroName, { color: c.text.primary }]}>
            {fullName}
          </Text>
          <Text style={[s.heroUsername, { color: c.text.secondary }]}>
            @{profile.username}
          </Text>
          {profile.neighborhood ? (
            <View style={s.heroLocationRow}>
              <MapPin size={14} color={accent} />
              <Text style={[s.heroLocation, { color: c.text.secondary }]}>
                {profile.neighborhood}
              </Text>
            </View>
          ) : null}
        </View>

        {/* ── Stats ── */}
        <View
          style={[
            s.statsCard,
            { backgroundColor: cardBg, borderColor: cardBorder },
          ]}
        >
          <StatItem
            icon={ArrowLeftRight}
            value={String(profile.swap_count)}
            label={t('profile.swaps', 'Swaps')}
          />
          <View style={[s.statDivider, { backgroundColor: cardBorder }]} />
          <StatItem
            icon={Star}
            value={
              profile.avg_rating > 0
                ? Number(profile.avg_rating).toFixed(1)
                : '—'
            }
            label={t('profile.rating', 'Rating')}
          />
          <View style={[s.statDivider, { backgroundColor: cardBorder }]} />
          <StatItem
            icon={BookOpen}
            value={String(profile.rating_count)}
            label={t('profile.reviews', 'Reviews')}
          />
        </View>

        {/* ── Recent Reviews ── */}
        <RecentReviews userId={userId} />

        {/* ── Info Cards ── */}
        <View style={s.infoSection}>
          <InfoCard
            icon={BookOpen}
            title={t('profile.bio', 'About')}
            content={profile.bio}
          />
          <InfoCard
            icon={Star}
            title={t('profile.genres', 'Favourite Genres')}
            content={genres}
          />
          <InfoCard
            icon={Globe}
            title={t('profile.language', 'Language')}
            content={formatLanguage(profile.preferred_language)}
          />
          <InfoCard
            icon={Calendar}
            title={t('profile.memberSince', 'Member Since')}
            content={
              memberSince
                ? t('profile.memberSinceValue', 'Since {{year}}', {
                    year: memberSince,
                  })
                : ''
            }
          />
        </View>

        {/* ── Safety Actions ── */}
        <View
          style={[
            s.actionsCard,
            { backgroundColor: cardBg, borderColor: cardBorder },
          ]}
        >
          {/* Block — still placeholder until GAP-C02 */}
          <Pressable
            disabled
            style={({ pressed }) => [
              s.actionRow,
              { opacity: pressed ? 0.7 : 0.45 },
            ]}
          >
            <View style={[s.actionIcon, { backgroundColor: accent + '18' }]}>
              <ShieldAlert size={18} color={accent} />
            </View>
            <View style={s.actionTextWrap}>
              <Text style={[s.actionLabel, { color: c.text.primary }]}>
                {t('profile.public.blockUser', 'Block User')}
              </Text>
              <Text style={[s.actionHint, { color: c.text.placeholder }]}>
                {t('profile.public.comingSoon', 'Coming soon')}
              </Text>
            </View>
          </Pressable>

          <View
            style={[
              s.actionDivider,
              { backgroundColor: cardBorder + '50' },
            ]}
          />

          {/* Report — functional */}
          <Pressable
            onPress={() => setReportVisible(true)}
            style={({ pressed }) => [
              s.actionRow,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View style={[s.actionIcon, { backgroundColor: accent + '18' }]}>
              <Flag size={18} color={accent} />
            </View>
            <View style={s.actionTextWrap}>
              <Text style={[s.actionLabel, { color: c.text.primary }]}>
                {t('profile.public.reportUser', 'Report User')}
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      <ReportSheet
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        reportedUserId={userId}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  scroll: {
    paddingHorizontal: spacing.md + 4,
    paddingTop: spacing.lg,
    paddingBottom: 40,
  },

  hero: { alignItems: 'center', marginBottom: spacing.xl },
  heroAvatarWrap: { marginBottom: spacing.md },
  heroName: { fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },
  heroUsername: { fontSize: 14, fontWeight: '500', marginTop: 2 },
  heroLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
  heroLocation: { fontSize: 13, fontWeight: '500' },

  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.xl,
    borderWidth: 1,
    paddingVertical: spacing.md + 4,
    marginBottom: spacing.xl,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600' },
  statDivider: { width: 1, height: 40 },

  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: spacing.md },

  reviewsSection: { marginBottom: spacing.xl },
  reviewsList: { gap: spacing.sm },
  loadMoreBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  loadMoreText: { fontSize: 14, fontWeight: '600' },

  infoSection: { gap: spacing.sm, marginBottom: spacing.xl },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md + 4,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  infoTextWrap: { flex: 1 },
  infoTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  infoContent: { fontSize: 15, lineHeight: 22 },

  actionsCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md + 4,
    paddingVertical: spacing.md + 2,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextWrap: { flex: 1 },
  actionLabel: { fontSize: 15, fontWeight: '600' },
  actionHint: { fontSize: 12, marginTop: 1 },
  actionDivider: { height: 1, marginHorizontal: spacing.md },
});
