import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AlertTriangle, CheckCircle, Eye, Inbox, MessageSquare, XCircle } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { radius, shadows, spacing } from '@/constants/theme';
import { useColors, useIsDark } from '@/hooks/useColors';
import { SkeletonCard } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import type { MessagesStackParamList } from '@/navigation/types';
import type { ExchangeListItem } from '@/types';
import { ExchangeStatusBadge } from '../components/ExchangeStatusBadge';
import {
  useAcceptExchange,
  useDeclineExchange,
  useIncomingRequests,
} from '../hooks/useExchanges';

type Nav = NativeStackNavigationProp<MessagesStackParamList, 'IncomingRequests'>;

export function IncomingRequestsScreen() {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const navigation = useNavigation<Nav>();

  const { data: requests, isLoading, isError, refetch, isRefetching } = useIncomingRequests();
  const acceptMutation = useAcceptExchange();
  const declineMutation = useDeclineExchange();

  const bg = isDark ? c.auth.bg : c.neutral[50];
  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;
  const accent = c.auth.golden;

  const handleAccept = useCallback(
    (id: string) => {
      Alert.alert(
        t('exchanges.acceptTitle', 'Accept Request?'),
        t('exchanges.acceptMsg', 'Other pending requests for this book will be automatically declined.'),
        [
          { text: t('common.cancel', 'Cancel'), style: 'cancel' },
          { text: t('exchanges.accept', 'Accept'), onPress: () => acceptMutation.mutate(id) },
        ],
      );
    },
    [acceptMutation, t],
  );

  const handleDecline = useCallback(
    (id: string) => {
      Alert.alert(
        t('exchanges.declineTitle', 'Decline Request?'),
        t('exchanges.declineMsg', 'The requester will be notified.'),
        [
          { text: t('common.cancel', 'Cancel'), style: 'cancel' },
          {
            text: t('exchanges.decline', 'Decline'),
            style: 'destructive',
            onPress: () => declineMutation.mutate({ exchangeId: id }),
          },
        ],
      );
    },
    [declineMutation, t],
  );

  const goToDetail = useCallback(
    (exchangeId: string) =>
      navigation.navigate('ExchangeDetail', { exchangeId }),
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: ExchangeListItem }) => (
      <View style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        {/* Requester info */}
        <View style={s.requesterRow}>
          <View style={[s.avatar, { backgroundColor: accent + '20' }]}>
            <Text style={[s.avatarText, { color: accent }]}>
              {item.requester.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={s.requesterInfo}>
            <Text style={[s.requesterName, { color: c.text.primary }]}>
              {item.requester.username}
            </Text>
            <Text style={[s.requesterMeta, { color: c.text.secondary }]}>
              {item.requester.swap_count} swaps · ★ {item.requester.avg_rating?.toFixed(1) ?? '—'}
            </Text>
          </View>
          <ExchangeStatusBadge status={item.status} />
        </View>

        {/* Books */}
        <View style={s.booksSection}>
          <View style={s.bookBlock}>
            <Text style={[s.bookLabel, { color: c.text.placeholder }]}>
              {t('exchanges.theyWant', 'They want')}
            </Text>
            <Text style={[s.bookName, { color: c.text.primary }]} numberOfLines={1}>
              {item.requested_book.title}
            </Text>
            <Text style={[s.bookAuthor, { color: c.text.secondary }]} numberOfLines={1}>
              {item.requested_book.author}
            </Text>
          </View>
          <View style={s.bookBlock}>
            <Text style={[s.bookLabel, { color: c.text.placeholder }]}>
              {t('exchanges.theyOffer', 'They offer')}
            </Text>
            <Text style={[s.bookName, { color: c.text.primary }]} numberOfLines={1}>
              {item.offered_book.title}
            </Text>
            <Text style={[s.bookAuthor, { color: c.text.secondary }]} numberOfLines={1}>
              {item.offered_book.author}
            </Text>
          </View>
        </View>

        {/* Message */}
        {!!item.message && (
          <View style={[s.messageBubble, { backgroundColor: isDark ? c.auth.bgDeep : c.neutral[50] }]}>
            <MessageSquare size={12} color={c.text.placeholder} />
            <Text style={[s.messageText, { color: c.text.secondary }]} numberOfLines={2}>
              "{item.message}"
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={s.actions}>
          <Pressable
            onPress={() => handleAccept(item.id)}
            style={({ pressed }) => [s.actionBtn, s.acceptBtn, { backgroundColor: accent, opacity: pressed ? 0.9 : 1 }]}
          >
            <CheckCircle size={16} color="#fff" />
            <Text style={s.actionBtnText}>{t('exchanges.accept', 'Accept')}</Text>
          </Pressable>
          <Pressable
            onPress={() => handleDecline(item.id)}
            style={({ pressed }) => [
              s.actionBtn,
              s.declineBtn,
              { borderColor: isDark ? '#EF4444' : '#DC2626', opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <XCircle size={16} color={isDark ? '#F87171' : '#DC2626'} />
            <Text style={[s.declineBtnText, { color: isDark ? '#F87171' : '#DC2626' }]}>
              {t('exchanges.decline', 'Decline')}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('exchanges.viewDetail', 'View exchange details')}
            onPress={() => goToDetail(item.id)}
            style={({ pressed }) => [s.actionBtn, s.viewBtn, { borderColor: cardBorder, opacity: pressed ? 0.9 : 1 }]}
          >
            <Eye size={16} color={c.text.secondary} />
          </Pressable>
        </View>
      </View>
    ),
    [c, isDark, cardBg, cardBorder, accent, handleAccept, handleDecline, goToDetail, t],
  );

  if (isError) {
    return (
      <View style={[s.root, { backgroundColor: bg, justifyContent: 'center' }]}>
        <EmptyState
          icon={AlertTriangle}
          title={t('common.loadError', 'Something went wrong')}
          subtitle={t('common.loadErrorHint', 'Check your connection and try again.')}
          actionLabel={t('common.retry', 'Retry')}
          onAction={() => refetch()}
        />
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: bg }]}>
      {isLoading ? (
        <View style={s.list}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (requests ?? []).length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={t('exchanges.noIncoming', 'No incoming requests')}
          subtitle={t('exchanges.noIncomingSub', 'When someone requests one of your books, it will appear here.')}
        />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(e) => e.id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          windowSize={5}
          maxToRenderPerBatch={8}
          removeClippedSubviews
          onRefresh={refetch}
          refreshing={isRefetching}
          ListFooterComponent={<View style={{ height: 20 }} />}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  loader: { marginTop: 40 },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: spacing.xl },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptySub: { fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 18 },

  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md },

  card: {
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    ...shadows.card,
  },

  requesterRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '700' },
  requesterInfo: { flex: 1 },
  requesterName: { fontSize: 14, fontWeight: '700' },
  requesterMeta: { fontSize: 11 },

  booksSection: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  bookBlock: { flex: 1 },
  bookLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  bookName: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  bookAuthor: { fontSize: 12 },

  messageBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  messageText: { flex: 1, fontSize: 12, fontStyle: 'italic', lineHeight: 16 },

  actions: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.lg,
  },
  acceptBtn: { flex: 2 },
  declineBtn: { flex: 2, borderWidth: 1, backgroundColor: 'transparent' },
  viewBtn: { width: 44, borderWidth: 1, backgroundColor: 'transparent' },
  actionBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  declineBtnText: { fontSize: 13, fontWeight: '700' },
});
