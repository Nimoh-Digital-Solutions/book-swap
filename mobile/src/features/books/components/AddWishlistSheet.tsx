import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useColors, useIsDark } from '@/hooks/useColors';
import { spacing, radius } from '@/constants/theme';
import { useAddWishlistItem } from '@/features/books/hooks/useWishlist';
import type { CreateWishlistPayload } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  prefill?: Partial<CreateWishlistPayload>;
}

export function AddWishlistSheet({ open, onClose, prefill }: Props) {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['65%'], []);
  const addItem = useAddWishlistItem();

  const accent = c.auth.golden;
  const bg = isDark ? c.auth.bg : c.neutral[50];
  const inputBg = isDark ? c.auth.card : c.surface.white;
  const inputBorder = isDark ? c.auth.cardBorder : c.border.default;

  const [title, setTitle] = useState(prefill?.title ?? '');
  const [author, setAuthor] = useState(prefill?.author ?? '');
  const [isbn, setIsbn] = useState(prefill?.isbn ?? '');
  const [genre, setGenre] = useState(prefill?.genre ?? '');

  const canSubmit = !!(title.trim() || isbn.trim() || genre.trim());

  const resetForm = useCallback(() => {
    setTitle(prefill?.title ?? '');
    setAuthor(prefill?.author ?? '');
    setIsbn(prefill?.isbn ?? '');
    setGenre(prefill?.genre ?? '');
  }, [prefill]);

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;

    const payload: CreateWishlistPayload = {};
    if (title.trim()) payload.title = title.trim();
    if (author.trim()) payload.author = author.trim();
    if (isbn.trim()) payload.isbn = isbn.trim();
    if (genre.trim()) payload.genre = genre.trim();
    if (prefill?.cover_url) payload.cover_url = prefill.cover_url;

    addItem.mutate(payload, {
      onSuccess: () => {
        resetForm();
        onClose();
        Alert.alert(
          t('books.wishlist.addedTitle', 'Added to Wishlist'),
          t('books.wishlist.addedMsg', "We'll let you know when a matching book becomes available."),
        );
      },
      onError: (err: any) => {
        const detail = err?.response?.data?.detail
          ?? err?.response?.data?.non_field_errors?.[0]
          ?? t('books.wishlist.addError', 'Failed to add to wishlist.');
        Alert.alert(t('common.error', 'Error'), String(detail));
      },
    });
  }, [canSubmit, title, author, isbn, genre, prefill, addItem, resetForm, onClose, t]);

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
      onClose={() => {
        resetForm();
        onClose();
      }}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: bg }}
      handleIndicatorStyle={{ backgroundColor: inputBorder, width: 40 }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
    >
      <BottomSheetScrollView
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[s.title, { color: c.text.primary }]}>
          {t('books.wishlist.addItem', 'Add to Wishlist')}
        </Text>
        <Text style={[s.subtitle, { color: c.text.secondary }]}>
          {t('books.wishlist.addHint', 'Fill in at least a title, ISBN, or genre.')}
        </Text>

        <SectionLabel text={t('books.wishlist.titleLabel', 'Title')} c={c} />
        <TextInput
          style={[s.input, { backgroundColor: inputBg, borderColor: inputBorder, color: c.text.primary }]}
          value={title}
          onChangeText={setTitle}
          placeholder={t('books.wishlist.titlePlaceholder', 'e.g. The Great Gatsby')}
          placeholderTextColor={c.text.placeholder}
        />

        <SectionLabel text={t('books.wishlist.authorLabel', 'Author')} c={c} />
        <TextInput
          style={[s.input, { backgroundColor: inputBg, borderColor: inputBorder, color: c.text.primary }]}
          value={author}
          onChangeText={setAuthor}
          placeholder={t('books.wishlist.authorPlaceholder', 'e.g. F. Scott Fitzgerald')}
          placeholderTextColor={c.text.placeholder}
        />

        <SectionLabel text={t('books.wishlist.isbnLabel', 'ISBN')} c={c} />
        <TextInput
          style={[s.input, { backgroundColor: inputBg, borderColor: inputBorder, color: c.text.primary }]}
          value={isbn}
          onChangeText={setIsbn}
          placeholder={t('books.wishlist.isbnPlaceholder', 'e.g. 9780743273565')}
          placeholderTextColor={c.text.placeholder}
          keyboardType="number-pad"
        />

        <SectionLabel text={t('books.wishlist.genreLabel', 'Genre')} c={c} />
        <TextInput
          style={[s.input, { backgroundColor: inputBg, borderColor: inputBorder, color: c.text.primary }]}
          value={genre}
          onChangeText={setGenre}
          placeholder={t('books.wishlist.genrePlaceholder', 'e.g. Fiction')}
          placeholderTextColor={c.text.placeholder}
        />

        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit || addItem.isPending}
          style={({ pressed }) => [
            s.submitBtn,
            {
              backgroundColor: accent,
              opacity: !canSubmit ? 0.5 : pressed ? 0.9 : 1,
            },
          ]}
        >
          {addItem.isPending ? (
            <ActivityIndicator size="small" color="#152018" />
          ) : (
            <Plus size={18} color="#152018" />
          )}
          <Text style={s.submitBtnText}>
            {addItem.isPending
              ? t('common.saving', 'Saving…')
              : t('books.wishlist.addItem', 'Add to Wishlist')}
          </Text>
        </Pressable>
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

function SectionLabel({ text, c }: { text: string; c: ReturnType<typeof useColors> }) {
  return (
    <Text style={[s.label, { color: c.text.primary }]}>{text}</Text>
  );
}

const s = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 20,
  },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: spacing.md },

  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 16,
    borderRadius: radius.xl,
    marginTop: spacing.xl,
  },
  submitBtnText: { color: '#152018', fontWeight: '700', fontSize: 16 },
});
