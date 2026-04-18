import React, { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import { Check, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors, useIsDark } from '@/hooks/useColors';
import { spacing, radius } from '@/constants/theme';
import { GENRE_VALUES, GENRE_VALUE_TO_I18N_KEY, type GenreValue } from '@/features/books/constants';

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
  const insets = useSafeAreaInsets();

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

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable
          style={[
            s.sheet,
            { backgroundColor: bg, paddingBottom: insets.bottom || spacing.md },
          ]}
          onPress={() => {}}
        >
          <View style={s.handleWrap}>
            <View style={[s.handle, { backgroundColor: cardBorder }]} />
          </View>

          <View style={s.header}>
            <Text style={[s.title, { color: c.text.primary }]}>
              {t('profile.edit.genresLabel', 'Preferred Genres')}
            </Text>
            <View style={s.headerRight}>
              <Text style={[s.counter, { color: c.text.secondary }]}>
                {value.length}/{MAX_GENRES}
              </Text>
              <Pressable onPress={onClose} hitSlop={12}>
                <X size={20} color={c.text.secondary} />
              </Pressable>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={s.listContent}
            showsVerticalScrollIndicator={false}
            style={s.list}
          >
            {GENRE_VALUES.map((genre) => {
              const selected = value.includes(genre);
              const disabled = !selected && value.length >= MAX_GENRES;
              const slug = GENRE_VALUE_TO_I18N_KEY[genre as GenreValue];
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
                      { color: selected ? (isDark ? accent : '#152018') : c.text.primary },
                    ]}
                  >
                    {t(`books.genres.${slug}`, genre)}
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
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '70%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle: { width: 40, height: 4, borderRadius: 2 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { fontSize: 18, fontWeight: '700' },
  counter: { fontSize: 14, fontWeight: '600' },

  list: { flexShrink: 1 },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
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
    paddingTop: spacing.md,
  },
  doneBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: radius.xl,
  },
  doneBtnText: { color: '#152018', fontSize: 16, fontWeight: '700' },
});
