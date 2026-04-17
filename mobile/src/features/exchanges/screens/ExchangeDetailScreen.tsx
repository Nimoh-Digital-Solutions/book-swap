import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { SkeletonBookDetail } from '@/components/Skeleton';
import { radius, shadows, spacing } from '@/constants/theme';
import { useColors, useIsDark } from '@/hooks/useColors';
import type { MessagesStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/stores/authStore';
import { ExchangeStatusBadge } from '../components/ExchangeStatusBadge';
import { ExchangeTimeline } from '../components/ExchangeTimeline';
import { DetailActions } from '../components/detail/DetailActions';
import { DetailBooksRow } from '../components/detail/DetailBooksRow';
import { DetailChatCTA } from '../components/detail/DetailChatCTA';
import { DetailOriginalBooksRow } from '../components/detail/DetailOriginalBooksRow';
import { DetailParticipants } from '../components/detail/DetailParticipants';
import { CHAT_ELIGIBLE_STATUSES } from '../constants';
import { useExchangeDetail } from '../hooks/useExchanges';
import { useExchangeWsRefresh } from '../hooks/useExchangeWsRefresh';

type Route = RouteProp<MessagesStackParamList, 'ExchangeDetail'>;
type Nav = NativeStackNavigationProp<MessagesStackParamList, 'ExchangeDetail'>;

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

export function ExchangeDetailScreen() {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();

  useExchangeWsRefresh();

  const { data: exchange, isLoading, refetch } = useExchangeDetail(params.exchangeId);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const bg = isDark ? c.auth.bg : c.neutral[50];
  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;

  const goToChat = useCallback(
    () => navigation.navigate('Chat', { exchangeId: params.exchangeId }),
    [navigation, params.exchangeId],
  );

  if (isLoading || !exchange) {
    return (
      <View style={[s.root, { backgroundColor: bg }]}>
        <SkeletonBookDetail />
      </View>
    );
  }

  const isChatEligible = CHAT_ELIGIBLE_STATUSES.includes(exchange.status);
  const currentUserId = useAuthStore((st) => st.user?.id);
  const isOwner = currentUserId === exchange.owner.id;

  const leftBook = isOwner ? exchange.requested_book : exchange.offered_book;
  const rightBook = isOwner ? exchange.offered_book : exchange.requested_book;
  const leftLabel = isOwner
    ? t('exchanges.yourBook', 'Your book')
    : t('exchanges.yourOffer', 'Your offer');
  const rightLabel = isOwner
    ? t('exchanges.theirOffer', 'Their offer')
    : t('exchanges.theirBook', 'Their book');

  return (
    <View style={[s.root, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Status + role + date */}
        <View style={s.statusRow}>
          <View style={s.statusLeft}>
            <ExchangeStatusBadge status={exchange.status} />
            <View style={[s.rolePill, { backgroundColor: c.auth.golden + '18' }]}>
              <Text style={[s.roleText, { color: c.auth.golden }]}>
                {isOwner
                  ? t('exchanges.roleOwner', 'Owner')
                  : t('exchanges.roleRequester', 'Requester')}
              </Text>
            </View>
          </View>
          <Text style={[s.date, { color: c.text.secondary }]}>
            {timeAgo(exchange.created_at)}
          </Text>
        </View>

        {exchange.original_offered_book && (
          <DetailOriginalBooksRow
            requestedBook={isOwner ? exchange.requested_book : exchange.original_offered_book}
            originalOfferedBook={isOwner ? exchange.original_offered_book : exchange.requested_book}
          />
        )}

        <DetailBooksRow
          requestedBook={leftBook}
          offeredBook={rightBook}
          requestedLabel={leftLabel}
          offeredLabel={rightLabel}
        />

        <DetailParticipants
          requester={exchange.requester}
          owner={exchange.owner}
          label={t('exchanges.participants', 'Participants')}
          requesterRole={t('exchanges.requester', 'Requester')}
          ownerRole={t('exchanges.owner', 'Owner')}
        />

        {/* Personal note */}
        {!!exchange.message && (
          <View style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Text style={[s.cardLabel, { color: c.text.placeholder }]}>
              {t('exchanges.personalNote', 'Personal note')}
            </Text>
            <Text style={[s.messageBody, { color: c.text.primary }]}>
              &ldquo;{exchange.message}&rdquo;
            </Text>
          </View>
        )}

        {/* Timeline */}
        <View style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[s.cardLabel, { color: c.text.placeholder }]}>
            {t('exchanges.progress', 'Progress')}
          </Text>
          <ExchangeTimeline status={exchange.status} />
        </View>

        {/* Actions */}
        <View style={s.actionsSection}>
          <DetailActions exchange={exchange} />
        </View>

        {isChatEligible && (
          <DetailChatCTA
            label={t('exchanges.openChat', 'Open Chat')}
            onPress={goToChat}
          />
        )}

        <View style={s.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: 16 },

  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    marginBottom: spacing.md,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rolePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  roleText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  date: { fontSize: 11, fontWeight: '500' },

  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    ...shadows.card,
  },
  cardLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: spacing.sm },
  messageBody: { fontSize: 14, fontStyle: 'italic', lineHeight: 22 },

  actionsSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },

  bottomSpacer: { height: 120 },
});
