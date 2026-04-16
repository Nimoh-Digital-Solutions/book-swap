import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BlurView } from 'expo-blur';
import {
  Settings,
  Pencil,
  MapPin,
  Star,
  ArrowLeftRight,
  BookOpen,
  Calendar,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useAuthStore } from '@/stores/authStore';
import { Avatar } from '@/components/Avatar';
import { useColors, useIsDark } from '@/hooks/useColors';
import { spacing, radius, shadows } from '@/constants/theme';
import type { ProfileStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'MyProfile'>;

const PILL_ICON_SIZE = 20;

function ProfileBottomBar() {
  const c = useColors();
  const isDark = useIsDark();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.floatingWrapper, { bottom: Math.max(insets.bottom, 16) + 60 }]}>
      <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={s.pill}>
        <View style={[s.pillInner, { borderColor: c.border.default + '40' }]}>
          <Pressable
            style={({ pressed }) => [s.pillItem, pressed && s.pillItemPressed]}
            onPress={() => navigation.navigate('Settings')}
            accessibilityRole="button"
            accessibilityLabel={t('profile.settings', 'Settings')}
          >
            <Settings size={PILL_ICON_SIZE} color={c.auth.bg} />
            <Text style={[s.pillLabel, { color: c.auth.bg }]} numberOfLines={1}>
              {t('profile.settings', 'Settings')}
            </Text>
          </Pressable>

          <View style={[s.pillDivider, { backgroundColor: c.border.default + '60' }]} />

          <Pressable
            style={({ pressed }) => [s.pillItem, pressed && s.pillItemPressed]}
            onPress={() => navigation.navigate('EditProfile')}
            accessibilityRole="button"
            accessibilityLabel={t('profile.editProfile', 'Edit Profile')}
          >
            <Pencil size={PILL_ICON_SIZE} color={c.auth.bg} />
            <Text style={[s.pillLabel, { color: c.auth.bg }]} numberOfLines={1}>
              {t('profile.editProfile', 'Edit Profile')}
            </Text>
          </Pressable>
        </View>
      </BlurView>
    </View>
  );
}

function StatItem({ icon: Icon, value, label, colors: c }: {
  icon: typeof Star;
  value: string;
  label: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={s.statItem}>
      <Icon size={18} color={c.auth.golden} />
      <Text style={[s.statValue, { color: c.text.primary }]}>{value}</Text>
      <Text style={[s.statLabel, { color: c.text.secondary }]}>{label}</Text>
    </View>
  );
}

function InfoCard({ icon: Icon, title, content, colors: c }: {
  icon: typeof MapPin;
  title: string;
  content: string;
  colors: ReturnType<typeof useColors>;
}) {
  if (!content) return null;
  return (
    <View style={[s.infoCard, { backgroundColor: c.surface.white, borderColor: c.border.default }]}>
      <View style={[s.infoIcon, { backgroundColor: c.auth.golden + '18' }]}>
        <Icon size={18} color={c.auth.goldenDark} />
      </View>
      <View style={s.infoTextWrap}>
        <Text style={[s.infoTitle, { color: c.text.secondary }]}>{title}</Text>
        <Text style={[s.infoContent, { color: c.text.primary }]}>{content}</Text>
      </View>
    </View>
  );
}

export function MyProfileScreen() {
  const { t } = useTranslation();
  const c = useColors();
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username;
  const memberSince = new Date(user.created_at).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
  const genres = user.preferred_genres?.length > 0
    ? user.preferred_genres.join(', ')
    : '';

  return (
    <View style={[s.root, { backgroundColor: c.neutral[50] }]}>
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
        <View style={[s.statsCard, { backgroundColor: c.surface.white, borderColor: c.border.default }]}>
          <StatItem
            icon={ArrowLeftRight}
            value={String(user.swap_count)}
            label={t('profile.swaps', 'Swaps')}
            colors={c}
          />
          <View style={[s.statDivider, { backgroundColor: c.border.default }]} />
          <StatItem
            icon={Star}
            value={user.avg_rating > 0 ? user.avg_rating.toFixed(1) : '—'}
            label={t('profile.rating', 'Rating')}
            colors={c}
          />
          <View style={[s.statDivider, { backgroundColor: c.border.default }]} />
          <StatItem
            icon={BookOpen}
            value={String(user.rating_count)}
            label={t('profile.reviews', 'Reviews')}
            colors={c}
          />
        </View>

        {/* ── Info Cards ── */}
        <View style={s.infoSection}>
          <InfoCard
            icon={BookOpen}
            title={t('profile.bio', 'About')}
            content={user.bio}
            colors={c}
          />
          <InfoCard
            icon={Star}
            title={t('profile.genres', 'Favourite Genres')}
            content={genres}
            colors={c}
          />
          <InfoCard
            icon={Calendar}
            title={t('profile.memberSince', 'Member Since')}
            content={memberSince}
            colors={c}
          />
        </View>
      </ScrollView>

      <ProfileBottomBar />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.md + 4, paddingTop: spacing.lg, paddingBottom: 160 },

  // Hero
  hero: { alignItems: 'center', marginBottom: spacing.xl },
  heroAvatarWrap: {
    marginBottom: spacing.md,
    ...shadows.elevated,
  },
  heroName: { fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },
  heroUsername: { fontSize: 14, fontWeight: '500', marginTop: 2 },
  heroLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
  heroLocation: { fontSize: 13, fontWeight: '500' },

  // Stats
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.xl,
    borderWidth: 1,
    paddingVertical: spacing.md + 4,
    marginBottom: spacing.xl,
    ...shadows.card,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600' },
  statDivider: { width: 1, height: 40 },

  // Info
  infoSection: { gap: spacing.sm },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md + 4,
    borderRadius: radius.xl,
    borderWidth: 1,
    ...shadows.card,
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
  infoTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 },
  infoContent: { fontSize: 15, lineHeight: 22 },

  // Floating pill
  floatingWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  pill: {
    borderRadius: 999,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  pillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  pillItemPressed: { opacity: 0.6 },
  pillDivider: { width: 1, height: 20, marginHorizontal: 8 },
  pillLabel: { fontSize: 13, fontWeight: '600' },
});
