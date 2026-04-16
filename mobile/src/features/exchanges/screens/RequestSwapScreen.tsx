import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { BookOpen, Check, MessageSquare, Send } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { radius, shadows, spacing } from '@/constants/theme';
import { useMyBooks } from '@/features/books/hooks/useBooks';
import { useColors, useIsDark } from '@/hooks/useColors';
import type { BrowseStackParamList } from '@/navigation/types';
import type { Book } from '@/types';
import { useCreateExchange } from '../hooks/useExchanges';

type Route = RouteProp<BrowseStackParamList, 'RequestSwap'>;

export function RequestSwapScreen() {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const navigation = useNavigation();
  const { params } = useRoute<Route>();

  const { data: myBooks, isLoading: loadingBooks } = useMyBooks();
  const createExchange = useCreateExchange();

  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const bg = isDark ? c.auth.bg : c.neutral[50];
  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;
  const accent = c.auth.golden;

  const availableBooks = (myBooks ?? []).filter((b) => b.is_available);

  const handleSubmit = () => {
    if (!selectedBookId) {
      Alert.alert(t('exchanges.selectBook', 'Select a book'), t('exchanges.selectBookMsg', 'Pick one of your books to offer in exchange.'));
      return;
    }
    createExchange.mutate(
      {
        requested_book_id: params.bookId,
        offered_book_id: selectedBookId,
        message: message.trim() || undefined,
      },
      {
        onSuccess: () => {
          Alert.alert(
            t('exchanges.requestSent', 'Request Sent!'),
            t('exchanges.requestSentMsg', 'The owner will be notified of your swap request.'),
            [{ text: 'OK', onPress: () => navigation.goBack() }],
          );
        },
        onError: (err: any) => {
          const detail = err?.response?.data?.detail
            ?? err?.response?.data?.requested_book_id?.[0]
            ?? err?.response?.data?.offered_book_id?.[0]
            ?? t('common.error', 'Something went wrong');
          Alert.alert(t('common.error', 'Error'), detail);
        },
      },
    );
  };

  const renderBook = ({ item }: { item: Book }) => {
    const isSelected = selectedBookId === item.id;
    return (
      <Pressable
        onPress={() => setSelectedBookId(item.id)}
        style={[
          s.bookRow,
          {
            backgroundColor: isSelected ? accent + '15' : cardBg,
            borderColor: isSelected ? accent : cardBorder,
          },
        ]}
      >
        <View style={[s.bookCover, { backgroundColor: isDark ? c.auth.bgDeep : '#E5E7EB' }]}>
          <Text style={s.bookCoverText} numberOfLines={2}>{item.title}</Text>
        </View>
        <View style={s.bookInfo}>
          <Text style={[s.bookTitle, { color: c.text.primary }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[s.bookAuthor, { color: c.text.secondary }]} numberOfLines={1}>
            {item.author}
          </Text>
          <Text style={[s.bookCondition, { color: c.text.placeholder }]}>
            {item.condition.replace('_', ' ')}
          </Text>
        </View>
        {isSelected && (
          <View style={[s.checkCircle, { backgroundColor: accent }]}>
            <Check size={14} color="#fff" strokeWidth={3} />
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <View style={[s.root, { backgroundColor: bg }]}>
      {/* Header instruction */}
      <View style={s.header}>
        <View style={[s.iconCircle, { backgroundColor: accent + '18' }]}>
          <BookOpen size={20} color={accent} />
        </View>
        <Text style={[s.headerTitle, { color: c.text.primary }]}>
          {t('exchanges.chooseBook', 'Choose a book to offer')}
        </Text>
        <Text style={[s.headerSub, { color: c.text.secondary }]}>
          {t('exchanges.chooseBookSub', 'Select one of your available books to swap.')}
        </Text>
      </View>

      {/* Book list */}
      {loadingBooks ? (
        <ActivityIndicator style={s.loader} color={accent} />
      ) : availableBooks.length === 0 ? (
        <View style={s.empty}>
          <Text style={[s.emptyText, { color: c.text.secondary }]}>
            {t('exchanges.noBooks', "You don't have any available books to offer. Add some books first!")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={availableBooks}
          keyExtractor={(b) => b.id}
          renderItem={renderBook}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View style={{ height: 200 }} />}
        />
      )}

      {/* Bottom: message + submit */}
      <View style={[s.bottomWrap, { borderTopColor: cardBorder }]}>
        <View style={[s.messageRow, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <MessageSquare size={16} color={c.text.placeholder} />
          <TextInput
            style={[s.messageInput, { color: c.text.primary }]}
            placeholder={t('exchanges.optionalMessage', 'Add a personal note (optional)')}
            placeholderTextColor={c.text.placeholder}
            value={message}
            onChangeText={setMessage}
            maxLength={200}
            multiline
          />
        </View>
        <Pressable
          onPress={handleSubmit}
          disabled={!selectedBookId || createExchange.isPending}
          style={({ pressed }) => [
            s.submitBtn,
            {
              backgroundColor: selectedBookId ? accent : accent + '40',
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          {createExchange.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Send size={16} color="#fff" />
              <Text style={s.submitText}>
                {t('exchanges.sendRequest', 'Send Swap Request')}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  headerSub: { fontSize: 13, textAlign: 'center' },

  loader: { marginTop: 40 },
  empty: { padding: spacing.xl, alignItems: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },

  list: { paddingHorizontal: spacing.lg, gap: spacing.sm },

  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm + 2,
    borderRadius: radius.lg,
    borderWidth: 1,
    ...shadows.card,
  },
  bookCover: {
    width: 52,
    height: 72,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    flexShrink: 0,
  },
  bookCoverText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 8,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  bookInfo: { flex: 1, marginLeft: spacing.sm },
  bookTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  bookAuthor: { fontSize: 12, marginBottom: 2 },
  bookCondition: { fontSize: 11, textTransform: 'capitalize' },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },

  bottomWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: spacing.sm + 2,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  messageInput: { flex: 1, fontSize: 14, maxHeight: 60, padding: 0 },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: radius.xl,
  },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
