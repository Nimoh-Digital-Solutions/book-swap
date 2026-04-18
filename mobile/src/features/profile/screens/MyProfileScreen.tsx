import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Settings,
  Pencil,
  MapPin,
  Star,
  ArrowLeftRight,
  BookOpen,
  Calendar,
  ChevronRight,
  Heart,
  LogOut,
  MessageSquareQuote,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useAuthStore } from '@/stores/authStore';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { Avatar } from '@/components/Avatar';
import { useColors, useIsDark } from '@/hooks/useColors';
import { spacing, radius } from '@/constants/theme';
import type { ProfileStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'MyProfile'>;

function StatItem({ icon: Icon, value, label }: {
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

function InfoCard({ icon: Icon, title, content }: {
  icon: typeof MapPin;
  title: string;
  content: string;
}) {
  const c = useColors();
  const isDark = useIsDark();
  if (!content) return null;
  return (
    <View style={[
      s.infoCard,
      {
        backgroundColor: isDark ? c.auth.card : c.surface.white,
        borderColor: isDark ? c.auth.cardBorder : c.border.default,
      },
    ]}>
      <View style={s.infoHeader}>
        <Icon size={15} color={c.auth.golden} />
        <Text style={[s.infoTitle, { color: c.text.secondary }]}>{title}</Text>
      </View>
      <Text style={[s.infoContent, { color: c.text.primary }]}>{content}</Text>
    </View>
  );
}

export function MyProfileScreen() {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  if (!user) return null;

  const bg = isDark ? c.auth.bg : c.neutral[50];
  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;
  const accent = c.auth.golden;

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username;
  const joinDate = new Date(user.created_at);
  const memberSince = isNaN(joinDate.getTime())
    ? ''
    : joinDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const genres = user.preferred_genres?.length > 0
    ? user.preferred_genres.join(', ')
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
            <Avatar uri={user.avatar} name={fullName} size={88} borderColor={c.auth.golden} />
          </View>
          <Text style={[s.heroName, { color: c.text.primary }]}>{fullName}</Text>
          <Text style={[s.heroUsername, { color: c.text.secondary }]}>@{user.username}</Text>
          {user.neighborhood ? (
            <View style={s.heroLocationRow}>
              <MapPin size={14} color={c.auth.golden} />
              <Text style={[s.heroLocation, { color: c.text.secondary }]}>{user.neighborhood}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Stats ── */}
        <View style={[s.statsCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <StatItem
            icon={ArrowLeftRight}
            value={String(user.swap_count)}
            label={t('profile.swaps', 'Swaps')}
          />
          <View style={[s.statDivider, { backgroundColor: cardBorder }]} />
          <StatItem
            icon={Star}
            value={user.avg_rating > 0 ? user.avg_rating.toFixed(1) : '—'}
            label={t('profile.rating', 'Rating')}
          />
          <View style={[s.statDivider, { backgroundColor: cardBorder }]} />
          <StatItem
            icon={BookOpen}
            value={String(user.rating_count)}
            label={t('profile.reviews', 'Reviews')}
          />
        </View>

        {/* ── Info Cards ── */}
        <View style={s.infoSection}>
          <InfoCard
            icon={BookOpen}
            title={t('profile.bio', 'About')}
            content={user.bio}
          />
          <InfoCard
            icon={Star}
            title={t('profile.genres', 'Favourite Genres')}
            content={genres}
          />
          <InfoCard
            icon={Calendar}
            title={t('profile.memberSince', 'Member Since')}
            content={memberSince}
          />
        </View>

        {/* ── Quick Actions ── */}
        <View style={[s.actionsCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('profile.editProfile', 'Edit Profile')}
            onPress={() => navigation.navigate('EditProfile')}
            style={({ pressed }) => [s.actionRow, pressed && { opacity: 0.7 }]}
          >
            <View style={[s.actionIcon, { backgroundColor: accent + '18' }]}>
              <Pencil size={18} color={accent} />
            </View>
            <Text style={[s.actionLabel, { color: c.text.primary }]}>
              {t('profile.editProfile', 'Edit Profile')}
            </Text>
            <ChevronRight size={18} color={c.text.placeholder} />
          </Pressable>

          <View style={[s.actionDivider, { backgroundColor: cardBorder + '50' }]} />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('profile.myBooks', 'My Books')}
            onPress={() => navigation.navigate('MyBooks')}
            style={({ pressed }) => [s.actionRow, pressed && { opacity: 0.7 }]}
          >
            <View style={[s.actionIcon, { backgroundColor: accent + '18' }]}>
              <BookOpen size={18} color={accent} />
            </View>
            <Text style={[s.actionLabel, { color: c.text.primary }]}>
              {t('profile.myBooks', 'My Books')}
            </Text>
            <ChevronRight size={18} color={c.text.placeholder} />
          </Pressable>

          <View style={[s.actionDivider, { backgroundColor: cardBorder + '50' }]} />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('profile.wishlist', 'Wishlist')}
            onPress={() => navigation.navigate('Wishlist')}
            style={({ pressed }) => [s.actionRow, pressed && { opacity: 0.7 }]}
          >
            <View style={[s.actionIcon, { backgroundColor: accent + '18' }]}>
              <Heart size={18} color={accent} />
            </View>
            <Text style={[s.actionLabel, { color: c.text.primary }]}>
              {t('profile.wishlist', 'Wishlist')}
            </Text>
            <ChevronRight size={18} color={c.text.placeholder} />
          </Pressable>

          <View style={[s.actionDivider, { backgroundColor: cardBorder + '50' }]} />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('profile.reviews', 'Reviews')}
            onPress={() => navigation.navigate('MyReviews')}
            style={({ pressed }) => [s.actionRow, pressed && { opacity: 0.7 }]}
          >
            <View style={[s.actionIcon, { backgroundColor: accent + '18' }]}>
              <MessageSquareQuote size={18} color={accent} />
            </View>
            <Text style={[s.actionLabel, { color: c.text.primary }]}>
              {t('profile.reviews', 'Reviews')}
            </Text>
            <ChevronRight size={18} color={c.text.placeholder} />
          </Pressable>

          <View style={[s.actionDivider, { backgroundColor: cardBorder + '50' }]} />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('profile.settings', 'Settings')}
            onPress={() => navigation.navigate('Settings')}
            style={({ pressed }) => [s.actionRow, pressed && { opacity: 0.7 }]}
          >
            <View style={[s.actionIcon, { backgroundColor: accent + '18' }]}>
              <Settings size={18} color={accent} />
            </View>
            <Text style={[s.actionLabel, { color: c.text.primary }]}>
              {t('profile.settings', 'Settings')}
            </Text>
            <ChevronRight size={18} color={c.text.placeholder} />
          </Pressable>

          <View style={[s.actionDivider, { backgroundColor: cardBorder + '50' }]} />

          <Pressable
            onPress={() => logout.mutate()}
            style={({ pressed }) => [s.actionRow, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel={t('auth.logout', 'Log Out')}
          >
            <View style={[s.actionIcon, { backgroundColor: c.status.error + '18' }]}>
              <LogOut size={18} color={c.status.error} />
            </View>
            <Text style={[s.actionLabel, { color: c.status.error }]}>
              {t('auth.logout', 'Log Out')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.md + 4, paddingTop: spacing.lg, paddingBottom: 20 },

  hero: { alignItems: 'center', marginBottom: spacing.xl },
  heroAvatarWrap: { marginBottom: spacing.md },
  heroName: { fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },
  heroUsername: { fontSize: 14, fontWeight: '500', marginTop: 2 },
  heroLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
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
  infoTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
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
  actionLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
  actionDivider: { height: 1, marginHorizontal: spacing.md },
});
