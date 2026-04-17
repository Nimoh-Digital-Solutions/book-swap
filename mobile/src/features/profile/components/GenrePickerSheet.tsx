import React, { useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useColors, useIsDark } from '@/hooks/useColors';
import { spacing, radius } from '@/constants/theme';
import { GENRE_OPTIONS } from '@/features/books/constants';

const MAX_GENRES = 5;

interface Props {
  value: string[];
  onChange: (genres: string[]) => void;
  open: boolean;
  onClose: () => void;
}

export function GenrePickerSheet({ value, onChange, open, onClose }: Props) {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['60%'], []);

  const accent = c.auth.golden;
  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;
  const bg = isDark ? c.auth.bg : c.neutral[50];

  const toggle = useCallback(
    (genre: string) => {
      if (value.includes(genre)) {
        onChange(value.filter((g) => g !== genre));
      } else if (value.length < MAX_GENRES) {
        onChange([...value, genre]);
      }
    },
    [value, onChange],
  );

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    [],
  );

  if (!open) return null;

  return (
    <BottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: bg }}
      handleIndicatorStyle={{ backgroundColor: cardBorder, width: 40 }}
    >
      <View style={s.header}>
        <Text style={[s.title, { color: c.text.primary }]}>
          {t('profile.edit.genresLabel', 'Preferred Genres')}
        </Text>
        <Text style={[s.counter, { color: c.text.secondary }]}>
          {value.length}/{MAX_GENRES}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
      >
        {GENRE_OPTIONS.map((genre) => {
          const selected = value.includes(genre);
          const disabled = !selected && value.length >= MAX_GENRES;
          return (
            <Pressable
              key={genre}
              onPress={() => !disabled && toggle(genre)}
              style={({ pressed }) => [
                s.row,
                {
                  backgroundColor: selected ? accent + '14' : cardBg,
                  borderColor: selected ? accent : cardBorder,
                  opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text
                style={[
                  s.rowText,
                  { color: selected ? accent : c.text.primary },
                ]}
              >
                {genre}
              </Text>
              {selected && (
                <View style={[s.checkCircle, { backgroundColor: accent }]}>
                  <Check size={14} color="#fff" strokeWidth={3} />
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={[s.footer, { borderTopColor: cardBorder }]}>
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [
            s.doneBtn,
            { backgroundColor: accent, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Text style={s.doneBtnText}>
            {t('common.done', 'Done')}
          </Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: { fontSize: 18, fontWeight: '700' },
  counter: { fontSize: 14, fontWeight: '600' },

  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.xs + 2,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  rowText: { fontSize: 15, fontWeight: '600' },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  footer: {
    borderTopWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  doneBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: radius.xl,
  },
  doneBtnText: { color: '#152018', fontSize: 16, fontWeight: '700' },
});
