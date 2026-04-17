import { BookOpen, Coffee, Landmark, MapPin, TreePine, X } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { radius, spacing } from '@/constants/theme';
import { useColors, useIsDark } from '@/hooks/useColors';
import type { MeetupLocation } from '@/types';

interface Props {
  visible: boolean;
  locations: MeetupLocation[];
  isLoading: boolean;
  onSelect: (location: MeetupLocation) => void;
  onClose: () => void;
}

const CATEGORY_ICONS: Record<string, typeof MapPin> = {
  library: BookOpen,
  cafe: Coffee,
  park: TreePine,
  station: Landmark,
};

export function MeetupSuggestionPanel({ visible, locations, isLoading, onSelect, onClose }: Props) {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const accent = c.auth.golden;
  const sheetBg = isDark ? c.auth.bgDeep : '#fff';
  const cardBg = isDark ? c.auth.card : c.neutral[50];
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;
  const handleBg = isDark ? c.auth.cardBorder : c.neutral[300];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <Pressable style={s.backdropTap} onPress={onClose} />
        <View style={[s.sheet, { backgroundColor: sheetBg }]}>
          <View style={[s.handle, { backgroundColor: handleBg }]} />

          <View style={s.header}>
            <View style={s.headerLeft}>
              <MapPin size={18} color={accent} />
              <Text style={[s.title, { color: c.text.primary }]}>
                {t('messaging.meetupTitle', 'Suggest Meetup')}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12}>
              <X size={20} color={c.text.secondary} />
            </Pressable>
          </View>

          <ScrollView style={s.list} showsVerticalScrollIndicator={false} bounces>
            {isLoading && (
              <ActivityIndicator size="small" color={accent} style={s.loader} />
            )}
            {!isLoading && locations.length === 0 && (
              <Text style={[s.empty, { color: c.text.secondary }]}>
                {t('messaging.noMeetups', 'No meetup locations found nearby.')}
              </Text>
            )}
            {!isLoading && locations.map((loc) => {
              const Icon = CATEGORY_ICONS[loc.category] ?? MapPin;
              return (
                <Pressable
                  key={loc.id}
                  onPress={() => onSelect(loc)}
                  style={({ pressed }) => [
                    s.card,
                    { backgroundColor: cardBg, borderColor: cardBorder, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <View style={[s.iconWrap, { backgroundColor: isDark ? c.auth.cardBorder : c.neutral[200] }]}>
                    <Icon size={18} color={accent} />
                  </View>
                  <View style={s.cardContent}>
                    <Text style={[s.cardName, { color: c.text.primary }]} numberOfLines={1}>{loc.name}</Text>
                    <Text style={[s.cardAddr, { color: c.text.secondary }]} numberOfLines={1}>{loc.address}</Text>
                    <Text style={[s.cardCategory, { color: c.text.placeholder }]}>
                      {loc.category}
                    </Text>
                  </View>
                  <View style={[s.selectBtn, { backgroundColor: accent }]}>
                    <Text style={s.selectText}>
                      {t('messaging.selectMeetup', 'Select')}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  backdropTap: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl + 16,
    paddingTop: spacing.sm,
    maxHeight: '70%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  list: {
    flexShrink: 1,
  },
  loader: {
    marginVertical: spacing.xl,
  },
  empty: {
    textAlign: 'center',
    marginVertical: spacing.xl,
    fontSize: 14,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    padding: spacing.sm + 4,
    borderRadius: radius.xl,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    gap: 1,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardAddr: {
    fontSize: 12,
  },
  cardCategory: {
    fontSize: 10,
    textTransform: 'capitalize',
    marginTop: 1,
  },
  selectBtn: {
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  selectText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#152018',
  },
});
