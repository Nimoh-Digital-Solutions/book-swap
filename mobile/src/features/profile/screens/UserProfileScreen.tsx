import React, { useCallback, useState } from 'react';
import {
  Alert,
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  MapPin,
  Star,
  ArrowLeftRight,
  BookOpen,
  Calendar,
  ChevronRight,
  Globe,
  UserX,
  ShieldAlert,
  Flag,
  MessageSquareQuote,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { BrandedLoader } from '@/components/BrandedLoader';
import { useColors, useIsDark } from '@/hooks/useColors';
import { spacing, radius } from '@/constants/theme';
import { usePublicProfile } from '@/features/profile/hooks/usePublicProfile';
import { useBlockUser, useIsBlocked } from '@/features/trust-safety/hooks/useBlocks';
import { ReportSheet } from '@/features/trust-safety/components/ReportSheet';
import { showSuccessToast, showErrorToast } from '@/components/Toast';
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
      <View style={s.infoHeader}>
        <Icon size={15} color={c.auth.golden} />
        <Text style={[s.infoTitle, { color: c.text.secondary }]}>{title}</Text>
      </View>
      <Text style={[s.infoContent, { color: c.text.primary }]}>
        {content}
      </Text>
    </View>
  );
}

function formatLanguage(lang: string, t: (key: string, fallback: string) => string): string {
  return t(`languages.${lang}`, lang.toUpperCase());
}

type Nav = NativeStackNavigationProp<HomeStackParamList, 'UserProfile'>;

export function UserProfileScreen() {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const { params } = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { userId } = params;

  const { data: profile, isLoading, isError } = usePublicProfile(userId);
  const blockUser = useBlockUser();
  const isBlocked = useIsBlocked(userId);
  const [reportVisible, setReportVisible] = useState(false);

  const handleBlock = useCallback(() => {
    Alert.alert(
      t('profile.public.blockTitle', 'Block {{name}}?', {
        name: profile?.first_name || profile?.username || '',
      }),
      t(
        'profile.public.blockMessage',
        'They won\'t be able to see your books or send you swap requests.',
      ),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('profile.public.blockConfirm', 'Block'),
          style: 'destructive',
          onPress: () =>
            blockUser.mutate(userId, {
              onSuccess: () => {
                showSuccessToast(t('profile.public.blocked', 'User blocked'));
                navigation.goBack();
              },
              onError: () =>
                showErrorToast(t('profile.public.blockError', 'Failed to block user')),
            }),
        },
      ],
    );
  }, [blockUser, userId, profile, t, navigation]);

  const bg = isDark ? c.auth.bg : c.neutral[50];
  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;
  const accent = c.auth.golden;

  if (isLoading) {
    return (
      <View style={[s.root, s.center, { backgroundColor: bg }]}>
        <BrandedLoader size="lg" />
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
              profile.avg_rating != null && profile.avg_rating > 0
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

        {/* ── Member since ── */}
        {memberSince ? (
          <View style={s.memberSinceRow}>
            <Calendar size={13} color={c.text.placeholder} />
            <Text style={[s.memberSinceText, { color: c.text.placeholder }]}>
              {t('profile.memberSinceValue', 'Since {{year}}', { year: memberSince })}
            </Text>
          </View>
        ) : null}

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
        </View>

        {/* ── Actions Card ── */}
        <View
          style={[
            s.actionsCard,
            { backgroundColor: cardBg, borderColor: cardBorder },
          ]}
        >
          {/* Reviews */}
          <Pressable
            onPress={() =>
              navigation.navigate('UserReviews', {
                userId,
                username: profile.username,
              })
            }
            style={({ pressed }) => [
              s.actionRow,
              pressed && { opacity: 0.7 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('profile.public.a11y.viewReviews', 'View reviews')}
          >
            <View style={[s.actionIcon, { backgroundColor: accent + '18' }]}>
              <MessageSquareQuote size={18} color={accent} />
            </View>
            <View style={s.actionTextWrap}>
              <Text style={[s.actionLabel, { color: c.text.primary }]}>
                {t('profile.reviews', 'Reviews')}
              </Text>
              <Text style={[s.actionHint, { color: c.text.secondary }]}>
                {t('reviews.count', '{{count}} review(s)', {
                  count: profile.rating_count ?? 0,
                })}
              </Text>
            </View>
            <ChevronRight size={18} color={c.text.placeholder} />
          </Pressable>

          <View style={[s.actionDivider, { backgroundColor: cardBorder + '50' }]} />

          {/* Language */}
          <View style={s.actionRow}>
            <View style={[s.actionIcon, { backgroundColor: accent + '18' }]}>
              <Globe size={18} color={accent} />
            </View>
            <View style={s.actionTextWrap}>
              <Text style={[s.actionLabel, { color: c.text.primary }]}>
                {t('profile.language', 'Language')}
              </Text>
              <Text style={[s.actionHint, { color: c.text.secondary }]}>
                {formatLanguage(profile.preferred_language, t)}
              </Text>
            </View>
          </View>

          <View style={[s.actionDivider, { backgroundColor: cardBorder + '50' }]} />

          {/* Block */}
          <Pressable
            onPress={handleBlock}
            disabled={blockUser.isPending || isBlocked}
            style={({ pressed }) => [
              s.actionRow,
              { opacity: isBlocked ? 0.45 : pressed ? 0.7 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              isBlocked
                ? t('profile.public.a11y.userBlocked', 'User blocked')
                : t('profile.public.a11y.blockUser', 'Block user')
            }
          >
            <View style={[s.actionIcon, { backgroundColor: accent + '18' }]}>
              <ShieldAlert size={18} color={accent} />
            </View>
            <View style={s.actionTextWrap}>
              <Text style={[s.actionLabel, { color: c.text.primary }]}>
                {isBlocked
                  ? t('profile.public.userBlocked', 'User Blocked')
                  : t('profile.public.blockUser', 'Block User')}
              </Text>
            </View>
          </Pressable>

          <View style={[s.actionDivider, { backgroundColor: cardBorder + '50' }]} />

          {/* Report */}
          <Pressable
            onPress={() => setReportVisible(true)}
            style={({ pressed }) => [
              s.actionRow,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('profile.public.a11y.reportUser', 'Report user')}
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
    paddingBottom: 20,
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
    marginBottom: spacing.sm,
  },
  memberSinceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginBottom: spacing.xl,
  },
  memberSinceText: { fontSize: 12, fontWeight: '500' },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600' },
  statDivider: { width: 1, height: 40 },

  infoSection: { gap: spacing.sm, marginBottom: spacing.xl },
  infoCard: {
    padding: spacing.md + 4,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  infoTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
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
