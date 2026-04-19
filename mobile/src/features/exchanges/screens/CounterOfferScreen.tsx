import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Image } from 'expo-image';
import { BookOpen, Check, RefreshCw } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { SkeletonCard } from '@/components/Skeleton';
import { radius, shadows, spacing } from '@/constants/theme';
import { useUserBooks } from '@/features/books/hooks/useBooks';
import { useColors, useIsDark } from '@/hooks/useColors';
import type { MessagesStackParamList } from '@/navigation/types';
import type { Book } from '@/types';
import { useCounterExchange } from '../hooks/useExchanges';

type Route = RouteProp<MessagesStackParamList, 'CounterOffer'>;

const COVER_COLORS = ['#2D5F3F', '#3B4F7A', '#6B3A5E', '#7A5C2E', '#2B4E5F'];
export function CounterOfferScreen() {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const navigation = useNavigation();
  const { params } = useRoute<Route>();

  const { data: requesterBooks, isLoading } = useUserBooks(params.requesterId);
  const counterMutation = useCounterExchange();

  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  const bg = isDark ? c.auth.bg : c.neutral[50];
  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;
  const accent = c.auth.golden;

  const availableBooks = (requesterBooks ?? []).filter((b) => b.status === 'available');

  const handleSubmit = () => {
    if (!selectedBookId) {
      Alert.alert(
        t('exchanges.selectBook', 'Select a book'),
        t('exchanges.selectCounterBookMsg', 'Pick a book from the other party\'s shelf.'),
      );
      return;
    }
    counterMutation.mutate(
      {
        exchangeId: params.exchangeId,
        payload: { offered_book_id: selectedBookId },
      },
      {
        onSuccess: () => {
          Alert.alert(
            t('exchanges.counterSent', 'Counter Offer Sent!'),
            t('exchanges.counterSentMsg', 'The other party will be notified of your counter offer.'),
            [{ text: 'OK', onPress: () => navigation.goBack() }],
          );
        },
        onError: (err: any) => {
          const detail =
            err?.response?.data?.detail ??
            err?.response?.data?.offered_book_id?.[0] ??
            t('common.error', 'Something went wrong');
          Alert.alert(t('common.error', 'Error'), detail);
        },
      },
    );
  };

  const renderBook = ({ item }: { item: Book }) => {
    const isSelected = selectedBookId === item.id;
    const coverUri = item.cover_url || item.primary_photo || item.photos?.[0]?.image || null;
    const coverBg = COVER_COLORS[item.id.charCodeAt(0) % COVER_COLORS.length];

    return (
      <Pressable
        onPress={() => setSelectedBookId(item.id)}
        style={({ pressed }) => [
          s.gridCard,
          {
            backgroundColor: isSelected ? accent + '12' : cardBg,
            borderColor: isSelected ? accent : cardBorder,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        {isSelected && (
          <View style={[s.checkBadge, { backgroundColor: accent }]}>
            <Check size={12} color="#fff" strokeWidth={3} />
          </View>
        )}

        <View style={[s.coverWrap, { backgroundColor: coverBg }]}>
          {coverUri ? (
            <Image source={{ uri: coverUri }} style={s.coverImage} contentFit="cover" />
          ) : (
            <Text style={s.coverFallback} numberOfLines={2}>
              {item.title}
            </Text>
          )}
        </View>

        <View style={s.cardBody}>
          <Text style={[s.cardTitle, { color: c.text.primary }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[s.cardAuthor, { color: c.text.secondary }]} numberOfLines={1}>
            {item.author}
          </Text>
          <View style={[s.conditionPill, { backgroundColor: accent + '14' }]}>
            <Text style={[s.conditionText, { color: accent }]}>
              {t(`books.conditions.${item.condition}`, { defaultValue: item.condition })}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  const listHeader = (
    <View style={s.header}>
      <View style={[s.iconCircle, { backgroundColor: accent + '18' }]}>
        <RefreshCw size={20} color={accent} />
      </View>
      <Text style={[s.headerTitle, { color: c.text.primary }]}>
        {t('exchanges.counterOfferTitle', 'Counter Offer')}
      </Text>
      <Text style={[s.headerSub, { color: c.text.secondary }]}>
        {t('exchanges.counterOfferSub', {
          defaultValue: 'Pick a different book from @{{name}}\'s shelf.',
          name: params.requesterName,
        })}
      </Text>
    </View>
  );

  const listFooter = (
    <View style={[s.bottomWrap, { borderTopColor: cardBorder }]}>
      <Pressable
        onPress={handleSubmit}
        disabled={!selectedBookId || counterMutation.isPending}
        style={({ pressed }) => [
          s.submitBtn,
          {
            backgroundColor: selectedBookId ? accent : accent + '40',
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        {counterMutation.isPending ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <RefreshCw size={16} color="#fff" />
            <Text style={s.submitText}>
              {t('exchanges.sendCounterOffer', 'Send Counter Offer')}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );

  return (
    <View style={[s.root, { backgroundColor: bg }]}>
      {isLoading ? (
        <View style={{ flex: 1 }}>
          {listHeader}
          <View style={s.loaderWrap}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        </View>
      ) : availableBooks.length === 0 ? (
        <View style={{ flex: 1 }}>
          {listHeader}
          <EmptyState
            icon={BookOpen}
            title={t('exchanges.noOtherBooks', 'No available books')}
            subtitle={t(
              'exchanges.noOtherBooksSub',
              'This user doesn\'t have any available books to offer.',
            )}
            compact
          />
        </View>
      ) : (
        <FlatList
          data={availableBooks}
          keyExtractor={(b) => b.id}
          renderItem={renderBook}
          numColumns={2}
          columnWrapperStyle={s.gridRow}
          contentContainerStyle={s.gridContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
        />
      )}
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

  loaderWrap: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },

  gridContent: { paddingHorizontal: spacing.md, paddingTop: spacing.xs },
  gridRow: { gap: spacing.sm, marginBottom: spacing.sm },

  gridCard: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
    ...shadows.card,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  coverWrap: {
    width: '100%',
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coverImage: { width: '100%', height: '100%' },
  coverFallback: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.sm,
  },

  cardBody: { padding: spacing.sm + 2 },
  cardTitle: { fontSize: 13, fontWeight: '700', lineHeight: 17, marginBottom: 2 },
  cardAuthor: { fontSize: 11, marginBottom: spacing.xs },
  conditionPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginTop: 2,
  },
  conditionText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },

  bottomWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
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
