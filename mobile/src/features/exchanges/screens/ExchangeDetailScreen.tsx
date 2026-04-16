import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  AlertCircle,
  ArrowLeftRight,
  CheckCircle,
  Clock,
  MessageCircle,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from 'lucide-react-native';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { radius, shadows, spacing } from '@/constants/theme';
import { useColors, useIsDark } from '@/hooks/useColors';
import type { MessagesStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/stores/authStore';
import type { ExchangeBook, ExchangeDetail } from '@/types';
import { ExchangeStatusBadge } from '../components/ExchangeStatusBadge';
import { ExchangeTimeline } from '../components/ExchangeTimeline';
import { CHAT_ELIGIBLE_STATUSES } from '../constants';
import {
  useAcceptConditions,
  useAcceptExchange,
  useCancelExchange,
  useConfirmReturn,
  useConfirmSwap,
  useDeclineExchange,
  useExchangeDetail,
  useRequestReturn,
} from '../hooks/useExchanges';

type Route = RouteProp<MessagesStackParamList, 'ExchangeDetail'>;
type Nav = NativeStackNavigationProp<MessagesStackParamList, 'ExchangeDetail'>;

// ── Book Panel ───────────────────────────────────────────────────────────────

function BookPanel({ book, label }: { book: ExchangeBook; label: string }) {
  const c = useColors();
  const isDark = useIsDark();

  return (
    <View style={s.bookPanel}>
      <Text style={[s.bookPanelLabel, { color: c.text.placeholder }]}>{label}</Text>
      <View style={[s.bookPanelCover, { backgroundColor: isDark ? c.auth.bgDeep : '#E5E7EB' }]}>
        <Text style={s.bookPanelCoverText} numberOfLines={2}>{book.title}</Text>
      </View>
      <Text style={[s.bookPanelTitle, { color: c.text.primary }]} numberOfLines={2}>
        {book.title}
      </Text>
      <Text style={[s.bookPanelAuthor, { color: c.text.secondary }]} numberOfLines={1}>
        {book.author}
      </Text>
    </View>
  );
}

// ── Detail Actions ───────────────────────────────────────────────────────────

function DetailActions({ exchange }: { exchange: ExchangeDetail }) {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const accent = c.auth.golden;

  const isOwner = currentUserId === exchange.owner.id;
  const isRequester = currentUserId === exchange.requester.id;

  const acceptMutation = useAcceptExchange();
  const declineMutation = useDeclineExchange();
  const cancelMutation = useCancelExchange();
  const acceptConditions = useAcceptConditions();
  const confirmSwap = useConfirmSwap();
  const requestReturn = useRequestReturn();
  const confirmReturn = useConfirmReturn();

  const confirm = (title: string, msg: string, onConfirm: () => void, destructive = false) => {
    Alert.alert(title, msg, [
      { text: t('common.cancel', 'Cancel'), style: 'cancel' },
      { text: t('common.confirm', 'Confirm'), style: destructive ? 'destructive' : 'default', onPress: onConfirm },
    ]);
  };

  const status = exchange.status;

  // ── Pending ──
  if (status === 'pending') {
    if (isOwner) {
      return (
        <View style={s.actionsWrap}>
          <Pressable
            style={({ pressed }) => [s.primaryBtn, { backgroundColor: accent, opacity: pressed ? 0.9 : 1 }]}
            onPress={() => confirm(
              t('exchanges.acceptTitle', 'Accept Request?'),
              t('exchanges.acceptMsg', 'Other pending requests for this book will be automatically declined.'),
              () => acceptMutation.mutate(exchange.id),
            )}
          >
            <CheckCircle size={16} color="#fff" />
            <Text style={s.primaryBtnText}>{t('exchanges.accept', 'Accept')}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [s.outlineBtn, { borderColor: '#EF4444', opacity: pressed ? 0.9 : 1 }]}
            onPress={() => confirm(
              t('exchanges.declineTitle', 'Decline?'),
              t('exchanges.declineMsg', 'The requester will be notified.'),
              () => declineMutation.mutate({ exchangeId: exchange.id }),
              true,
            )}
          >
            <XCircle size={16} color="#EF4444" />
            <Text style={[s.outlineBtnText, { color: '#EF4444' }]}>{t('exchanges.decline', 'Decline')}</Text>
          </Pressable>
        </View>
      );
    }
    if (isRequester) {
      return (
        <View style={s.actionsWrap}>
          <Pressable
            style={({ pressed }) => [s.outlineBtn, { borderColor: c.text.placeholder, opacity: pressed ? 0.9 : 1 }]}
            onPress={() => confirm(
              t('exchanges.cancelTitle', 'Cancel Request?'),
              t('exchanges.cancelMsg', 'Your swap request will be cancelled.'),
              () => cancelMutation.mutate(exchange.id),
              true,
            )}
          >
            <XCircle size={16} color={c.text.secondary} />
            <Text style={[s.outlineBtnText, { color: c.text.secondary }]}>
              {t('exchanges.cancelRequest', 'Cancel Request')}
            </Text>
          </Pressable>
          <InfoRow icon={Clock} text={t('exchanges.waitingOwner', 'Waiting for the owner to respond...')} color={c.text.secondary} />
        </View>
      );
    }
  }

  // ── Accepted / Conditions Pending ──
  if (status === 'accepted' || status === 'conditions_pending') {
    const accepted = exchange.conditions_accepted_by_me;
    return (
      <View style={s.actionsWrap}>
        {!accepted ? (
          <Pressable
            style={({ pressed }) => [s.primaryBtn, { backgroundColor: accent, opacity: pressed ? 0.9 : 1 }]}
            onPress={() => confirm(
              t('exchanges.conditionsTitle', 'Accept Conditions'),
              t('exchanges.conditionsMsg', 'By accepting, you agree to the exchange conditions.'),
              () => acceptConditions.mutate(exchange.id),
            )}
          >
            <ShieldCheck size={16} color="#fff" />
            <Text style={s.primaryBtnText}>{t('exchanges.acceptConditions', 'Accept Exchange Conditions')}</Text>
          </Pressable>
        ) : (
          <InfoRow
            icon={CheckCircle}
            text={
              exchange.conditions_accepted_count === 2
                ? t('exchanges.bothAccepted', 'Both parties accepted conditions!')
                : t('exchanges.waitingOther', 'You accepted. Waiting for the other party...')
            }
            color={accent}
          />
        )}
      </View>
    );
  }

  // ── Active (confirm swap) ──
  if (status === 'active') {
    const myConfirmed = isRequester
      ? exchange.requester_confirmed_at
      : exchange.owner_confirmed_at;
    const partnerConfirmed = isRequester
      ? exchange.owner_confirmed_at
      : exchange.requester_confirmed_at;

    return (
      <View style={s.actionsWrap}>
        {!myConfirmed ? (
          <Pressable
            style={({ pressed }) => [s.primaryBtn, { backgroundColor: accent, opacity: pressed ? 0.9 : 1 }]}
            onPress={() => confirm(
              t('exchanges.confirmSwapTitle', 'Confirm Swap'),
              t('exchanges.confirmSwapMsg', 'Confirm that you have physically swapped the books.'),
              () => confirmSwap.mutate(exchange.id),
            )}
          >
            <ArrowLeftRight size={16} color="#fff" />
            <Text style={s.primaryBtnText}>{t('exchanges.confirmSwap', 'Confirm Swap')}</Text>
          </Pressable>
        ) : (
          <InfoRow
            icon={CheckCircle}
            text={t('exchanges.youConfirmed', 'You confirmed the swap.')}
            color={accent}
          />
        )}
        {partnerConfirmed && (
          <InfoRow icon={CheckCircle} text={t('exchanges.partnerConfirmed', 'Your partner also confirmed!')} color={accent} />
        )}
        {!partnerConfirmed && myConfirmed && (
          <InfoRow icon={Clock} text={t('exchanges.waitingPartner', 'Waiting for your partner to confirm...')} color={c.text.secondary} />
        )}
      </View>
    );
  }

  // ── Swap Confirmed (request return) ──
  if (status === 'swap_confirmed') {
    return (
      <View style={s.actionsWrap}>
        <InfoRow icon={CheckCircle} text={t('exchanges.swapComplete', 'Swap confirmed by both parties!')} color={accent} />
        <Pressable
          style={({ pressed }) => [s.outlineBtn, { borderColor: c.text.placeholder, opacity: pressed ? 0.9 : 1 }]}
          onPress={() => confirm(
            t('exchanges.returnTitle', 'Request Return?'),
            t('exchanges.returnMsg', 'You can request to return the books.'),
            () => requestReturn.mutate(exchange.id),
          )}
        >
          <RotateCcw size={16} color={c.text.secondary} />
          <Text style={[s.outlineBtnText, { color: c.text.secondary }]}>
            {t('exchanges.requestReturn', 'Request Return')}
          </Text>
        </Pressable>
      </View>
    );
  }

  // ── Return Requested ──
  if (status === 'return_requested') {
    const myReturnConfirmed = isRequester
      ? exchange.return_confirmed_requester
      : exchange.return_confirmed_owner;

    return (
      <View style={s.actionsWrap}>
        {!myReturnConfirmed ? (
          <Pressable
            style={({ pressed }) => [s.primaryBtn, { backgroundColor: accent, opacity: pressed ? 0.9 : 1 }]}
            onPress={() => confirm(
              t('exchanges.confirmReturnTitle', 'Confirm Return'),
              t('exchanges.confirmReturnMsg', 'Confirm that the books have been returned.'),
              () => confirmReturn.mutate(exchange.id),
            )}
          >
            <RotateCcw size={16} color="#fff" />
            <Text style={s.primaryBtnText}>{t('exchanges.confirmReturn', 'Confirm Return')}</Text>
          </Pressable>
        ) : (
          <InfoRow icon={Clock} text={t('exchanges.waitingReturnPartner', 'Waiting for partner to confirm return...')} color={c.text.secondary} />
        )}
      </View>
    );
  }

  // ── Terminal states ──
  if (status === 'declined') {
    return <InfoRow icon={XCircle} text={t('exchanges.wasDeclined', 'This request was declined.')} color="#EF4444" />;
  }
  if (status === 'cancelled') {
    return <InfoRow icon={XCircle} text={t('exchanges.wasCancelled', 'This request was cancelled.')} color={c.text.placeholder} />;
  }
  if (status === 'expired') {
    return <InfoRow icon={AlertCircle} text={t('exchanges.wasExpired', 'This request expired.')} color={c.text.placeholder} />;
  }
  if (status === 'returned') {
    return <InfoRow icon={CheckCircle} text={t('exchanges.booksReturned', 'Books have been returned.')} color={accent} />;
  }
  if (status === 'completed') {
    return <InfoRow icon={CheckCircle} text={t('exchanges.completed', 'Exchange completed!')} color={accent} />;
  }

  return null;
}

function InfoRow({ icon: Icon, text, color }: { icon: any; text: string; color: string }) {
  return (
    <View style={s.infoRow}>
      <Icon size={16} color={color} />
      <Text style={[s.infoText, { color }]}>{text}</Text>
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────

export function ExchangeDetailScreen() {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();

  const { data: exchange, isLoading } = useExchangeDetail(params.exchangeId);

  const bg = isDark ? c.auth.bg : c.neutral[50];
  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;
  const accent = c.auth.golden;

  const goToChat = useCallback(
    () => navigation.navigate('Chat', { exchangeId: params.exchangeId }),
    [navigation, params.exchangeId],
  );

  if (isLoading || !exchange) {
    return (
      <View style={[s.centered, { backgroundColor: bg }]}>
        <ActivityIndicator color={accent} />
      </View>
    );
  }

  const isChatEligible = CHAT_ELIGIBLE_STATUSES.includes(exchange.status);

  return (
    <View style={[s.root, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Status + date */}
        <View style={s.statusRow}>
          <ExchangeStatusBadge status={exchange.status} />
          <Text style={[s.date, { color: c.text.secondary }]}>
            {new Date(exchange.created_at).toLocaleDateString()}
          </Text>
        </View>

        {/* Books row */}
        <View style={s.booksRow}>
          <BookPanel book={exchange.requested_book} label={t('exchanges.requested', 'Requested')} />
          <View style={s.swapIcon}>
            <ArrowLeftRight size={18} color={accent} />
          </View>
          <BookPanel book={exchange.offered_book} label={t('exchanges.offered', 'Offered')} />
        </View>

        {/* Participants */}
        <View style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={s.participantRow}>
            <View style={[s.pAvatar, { backgroundColor: '#6366F120' }]}>
              <Text style={[s.pAvatarText, { color: '#6366F1' }]}>
                {exchange.requester.username.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={s.pInfo}>
              <Text style={[s.pName, { color: c.text.primary }]}>{exchange.requester.username}</Text>
              <Text style={[s.pRole, { color: c.text.secondary }]}>
                {t('exchanges.requester', 'Requester')} · {exchange.requester.swap_count} swaps
              </Text>
            </View>
          </View>
          <View style={[s.divider, { backgroundColor: cardBorder }]} />
          <View style={s.participantRow}>
            <View style={[s.pAvatar, { backgroundColor: '#8B5CF620' }]}>
              <Text style={[s.pAvatarText, { color: '#8B5CF6' }]}>
                {exchange.owner.username.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={s.pInfo}>
              <Text style={[s.pName, { color: c.text.primary }]}>{exchange.owner.username}</Text>
              <Text style={[s.pRole, { color: c.text.secondary }]}>
                {t('exchanges.owner', 'Owner')} · {exchange.owner.swap_count} swaps
              </Text>
            </View>
          </View>
        </View>

        {/* Message */}
        {!!exchange.message && (
          <View style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Text style={[s.cardLabel, { color: c.text.placeholder }]}>
              {t('exchanges.personalNote', 'Personal note')}
            </Text>
            <Text style={[s.messageBody, { color: c.text.primary }]}>
              "{exchange.message}"
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
        <View style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[s.cardLabel, { color: c.text.placeholder }]}>
            {t('exchanges.actions', 'Actions')}
          </Text>
          <DetailActions exchange={exchange} />
        </View>

        {/* Chat CTA */}
        {isChatEligible && (
          <Pressable
            onPress={goToChat}
            style={({ pressed }) => [s.chatBtn, { backgroundColor: accent + '15', borderColor: accent + '30', opacity: pressed ? 0.9 : 1 }]}
          >
            <MessageCircle size={18} color={accent} />
            <Text style={[s.chatBtnText, { color: accent }]}>
              {t('exchanges.openChat', 'Open Chat')}
            </Text>
          </Pressable>
        )}

        <View style={s.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    marginBottom: spacing.md,
  },
  date: { fontSize: 12 },

  booksRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  swapIcon: { paddingTop: 48, paddingHorizontal: spacing.sm },

  bookPanel: { flex: 1 },
  bookPanelLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  bookPanelCover: {
    height: 100,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  bookPanelCoverText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  bookPanelTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  bookPanelAuthor: { fontSize: 12 },

  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    ...shadows.card,
  },
  cardLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: spacing.sm },

  participantRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6 },
  pAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  pAvatarText: { fontSize: 15, fontWeight: '700' },
  pInfo: { flex: 1 },
  pName: { fontSize: 14, fontWeight: '700' },
  pRole: { fontSize: 11 },
  divider: { height: 1, marginVertical: 4 },

  messageBody: { fontSize: 14, fontStyle: 'italic', lineHeight: 20 },

  // Actions
  actionsWrap: { gap: spacing.sm },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: radius.xl,
  },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 12,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  outlineBtnText: { fontSize: 14, fontWeight: '600' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 4 },
  infoText: { fontSize: 13, fontWeight: '500', flex: 1 },

  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingVertical: 14,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  chatBtnText: { fontSize: 15, fontWeight: '700' },

  bottomSpacer: { height: 120 },
});
