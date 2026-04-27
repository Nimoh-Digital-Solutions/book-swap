import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, MapPin } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import { radius, spacing } from '@/constants/theme';
import { useColors, useIsDark } from '@/hooks/useColors';
import type { MessagesStackParamList } from '@/navigation/types';

interface Props {
  partnerName: string;
  partnerAvatar: string | null;
  isConnected: boolean;
  onSuggestMeetup: () => void;
  showMeetupButton?: boolean;
}

export function ChatHeader({
  partnerName,
  partnerAvatar,
  isConnected,
  onSuggestMeetup,
  showMeetupButton = true,
}: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<MessagesStackParamList, 'Chat'>>();
  const c = useColors();
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();
  const accent = c.auth.golden;
  const headerBg = isDark ? c.auth.bg : c.neutral[50];
  const borderColor = isDark ? c.auth.cardBorder : c.border.default;

  return (
    <View style={[s.container, { backgroundColor: headerBg, paddingTop: insets.top }]}>
      {/* Main row: back | name | avatar */}
      <View style={s.mainRow}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={s.backBtn}
          accessibilityRole="button"
          accessibilityLabel={t('common.back', 'Back')}
        >
          <ChevronLeft size={22} color={c.text.primary} />
          <Text style={[s.backText, { color: c.text.primary }]}>
            {t('common.back', 'Back')}
          </Text>
        </Pressable>

        <View style={s.center}>
          <Text style={[s.name, { color: c.text.primary }]} numberOfLines={1}>
            {partnerName}
          </Text>
          <View style={s.statusRow}>
            <View style={[s.statusDot, { backgroundColor: isConnected ? '#34D399' : c.text.secondary }]} />
            <Text style={[s.statusText, { color: isConnected ? '#34D399' : c.text.secondary }]}>
              {isConnected
                ? t('messaging.connected', 'Connected')
                : t('messaging.connecting', 'Connecting...')}
            </Text>
          </View>
        </View>

        <View style={s.right}>
          {partnerAvatar ? (
            <Image source={{ uri: partnerAvatar }} style={[s.avatar, { borderColor: accent, borderWidth: 2 }]} contentFit="cover" />
          ) : (
            <View style={[s.avatarFallback, { backgroundColor: isDark ? c.auth.card : c.neutral[200], borderColor: accent, borderWidth: 2 }]}>
              <Text style={[s.avatarLetter, { color: isDark ? c.auth.textSage : c.text.secondary }]}>
                {partnerName[0]?.toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Meetup button row */}
      {showMeetupButton && (
        <View style={[s.meetupRow, { borderTopColor: borderColor }]}>
          <Pressable
            onPress={onSuggestMeetup}
            style={({ pressed }) => [
              s.meetupBtn,
              { backgroundColor: isDark ? c.auth.card : c.neutral[100], opacity: pressed ? 0.8 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('messaging.suggestMeetup', 'Suggest Meetup')}
          >
            <MapPin size={13} color={accent} />
            <Text style={[s.meetupText, { color: isDark ? c.auth.textSage : c.text.secondary }]}>
              {t('messaging.suggestMeetup', 'Suggest Meetup')}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'transparent',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.sm + 2,
    minHeight: 48,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minWidth: 70,
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
  },
  right: {
    minWidth: 70,
    alignItems: 'flex-end',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 14,
    fontWeight: '700',
  },
  meetupRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    alignItems: 'center',
  },
  meetupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  meetupText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
