import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Search, BookOpen, X } from 'lucide-react-native';

import { useColors, useIsDark } from '@/hooks/useColors';
import { spacing, radius } from '@/constants/theme';
import {
  useExternalBookSearch,
  type ExternalBookResult,
} from '@/features/books/hooks/useBooks';
import type { ScanStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<ScanStackParamList, 'BookSearch'>;

export function BookSearchScreen() {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const navigation = useNavigation<Nav>();

  const [text, setText] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(text.trim()), 400);
    return () => clearTimeout(timer);
  }, [text]);

  const { data, isFetching, isError } = useExternalBookSearch(debounced);

  const bg = isDark ? c.auth.bg : c.neutral[50];
  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;
  const accent = c.auth.golden;
  const inputBg = isDark ? c.auth.card : c.surface.white;
  const inputBorder = isDark ? c.auth.cardBorder : c.border.default;

  const handleSelect = (item: ExternalBookResult) => {
    Keyboard.dismiss();
    navigation.navigate('ScanResult', {
      isbn: item.isbn,
      title: item.title,
      author: item.author,
      cover_url: item.cover_url,
      description: item.description,
      page_count: item.page_count,
      publish_year: item.publish_year,
    });
  };

  const renderItem = ({ item }: { item: ExternalBookResult }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}${item.author ? `, ${item.author}` : ''}`}
      style={({ pressed }) => [
        s.resultRow,
        {
          backgroundColor: pressed ? accent + '10' : cardBg,
          borderColor: cardBorder,
        },
      ]}
      onPress={() => handleSelect(item)}
    >
      {item.cover_url ? (
        <Image
          source={{ uri: item.cover_url }}
          style={s.thumb}
          contentFit="cover"
          transition={150}
        />
      ) : (
        <View style={[s.thumbPlaceholder, { backgroundColor: accent + '15' }]}>
          <BookOpen size={20} color={accent} />
        </View>
      )}
      <View style={s.resultInfo}>
        <Text
          style={[s.resultTitle, { color: c.text.primary }]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <Text
          style={[s.resultAuthor, { color: c.text.secondary }]}
          numberOfLines={1}
        >
          {item.author || t('books.search.unknownAuthor', 'Unknown author')}
        </Text>
        {item.isbn ? (
          <Text style={[s.resultIsbn, { color: c.text.placeholder }]}>
            ISBN {item.isbn}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );

  const showEmpty =
    debounced.length >= 2 && !isFetching && data && data.length === 0;

  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      {/* Search input */}
      <View style={s.inputWrap}>
        <View
          style={[
            s.inputRow,
            { backgroundColor: inputBg, borderColor: inputBorder },
          ]}
        >
          <Search size={18} color={c.text.placeholder} />
          <TextInput
            style={[s.input, { color: c.text.primary }]}
            value={text}
            onChangeText={setText}
            placeholder={t(
              'books.search.placeholder',
              'Search by title or author...',
            )}
            placeholderTextColor={c.text.placeholder}
            autoFocus
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {text.length > 0 && (
            <Pressable onPress={() => setText('')} hitSlop={8}>
              <X size={18} color={c.text.placeholder} />
            </Pressable>
          )}
        </View>
        {isFetching && (
          <ActivityIndicator
            size="small"
            color={accent}
            style={s.spinner}
          />
        )}
      </View>

      {/* Hint */}
      {debounced.length < 2 && !data && (
        <View style={s.hintWrap}>
          <Search size={40} color={c.text.placeholder} />
          <Text style={[s.hintTitle, { color: c.text.secondary }]}>
            {t('books.search.hintTitle', 'Find your book')}
          </Text>
          <Text style={[s.hintSub, { color: c.text.placeholder }]}>
            {t(
              'books.search.hintSub',
              'Type at least 2 characters to search Open Library by title or author.',
            )}
          </Text>
        </View>
      )}

      {/* Error */}
      {isError && (
        <View style={s.hintWrap}>
          <Text style={[s.hintTitle, { color: c.text.secondary }]}>
            {t('books.search.error', 'Search failed')}
          </Text>
          <Text style={[s.hintSub, { color: c.text.placeholder }]}>
            {t(
              'books.search.errorSub',
              'Please check your connection and try again.',
            )}
          </Text>
        </View>
      )}

      {/* Empty state */}
      {showEmpty && (
        <View style={s.hintWrap}>
          <Text style={[s.hintTitle, { color: c.text.secondary }]}>
            {t('books.search.noResults', 'No books found')}
          </Text>
          <Text style={[s.hintSub, { color: c.text.placeholder }]}>
            {t(
              'books.search.noResultsSub',
              'Try a different title or author, or add the book manually.',
            )}
          </Text>
          <Pressable
            style={({ pressed }) => [
              s.manualBtn,
              {
                backgroundColor: cardBg,
                borderColor: cardBorder,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
            onPress={() => navigation.navigate('AddBook', {})}
          >
            <Text style={[s.manualBtnText, { color: c.text.primary }]}>
              {t('books.search.addManually', 'Add manually')}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Results */}
      {data && data.length > 0 && (
        <FlatList
          data={data}
          keyExtractor={(item, idx) => `${item.isbn}-${idx}`}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          windowSize={5}
          maxToRenderPerBatch={8}
          removeClippedSubviews
        />
      )}
    </View>
  );
}

const THUMB_W = 48;
const THUMB_H = 66;

const s = StyleSheet.create({
  container: { flex: 1 },
  inputWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  spinner: {
    position: 'absolute',
    right: spacing.lg + 14,
    top: spacing.md + 12,
  },

  hintWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  hintTitle: { fontSize: 17, fontWeight: '600', textAlign: 'center' },
  hintSub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },

  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 20,
  },

  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  thumb: {
    width: THUMB_W,
    height: THUMB_H,
    borderRadius: radius.md,
  },
  thumbPlaceholder: {
    width: THUMB_W,
    height: THUMB_H,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultInfo: {
    flex: 1,
    gap: 2,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19,
  },
  resultAuthor: {
    fontSize: 13,
  },
  resultIsbn: {
    fontSize: 11,
    marginTop: 2,
  },

  manualBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.xl,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  manualBtnText: { fontWeight: '600', fontSize: 14 },
});
