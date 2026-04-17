import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
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
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SkeletonBookDetail } from '@/components/Skeleton';
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

const COVER_COLORS = ['#2D5F3F', '#3B4F7A', '#6B3A5E', '#7A5C2E', '#2B4E5F'];
const AVATAR_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

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

// ── Book Panel (matches ExchangeCard BookThumb) ──────────────────────────────

function BookPanel({ book, label }: { book: ExchangeBook; label: string }) {
  const c = useColors();
  const coverUri = book.cover_url || book.primary_photo;
  const coverBg = COVER_COLORS[book.id.charCodeAt(0) % COVER_COLORS.length];

  return (
    <View style={s.thumbWrap}>
      <View style={[s.thumb, { backgroundColor: coverBg }]}>
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={s.thumbImage} contentFit="cover" />
        ) : (
          <Text style={s.thumbFallback} numberOfLines={2}>{book.title}</Text>
        )}
      </View>
      <Text style={[s.thumbBookTitle, { color: c.text.primary }]} numberOfLines={1}>
        {book.title}
      </Text>
      <Text style={[s.thumbLabel, { color: c.text.secondary }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

// ── Detail Actions ───────────────────────────────────────────────────────────

function DetailActions({ exchange }: { exchange: ExchangeDetail }) {
  const { t } = useTranslation();
  const c = useColors();
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

  const doConfirm = (title: string, msg: string, onConfirm: () => void, destructive = false) => {
    Alert.alert(title, msg, [
      { text: t('common.cancel', 'Cancel'), style: 'cancel' },
      { text: t('common.confirm', 'Confirm'), style: destructive ? 'destructive' : 'default', onPress: onConfirm },
    ]);
  };

  const status = exchange.status;

  if (status === 'pending') {
    if (isOwner) {
      return (
        <View style={s.actionsWrap}>
          <Pressable
            style={({ pressed }) => [s.primaryBtn, { backgroundColor: accent, opacity: pressed ? 0.9 : 1 }]}
            onPress={() => doConfirm(
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
            onPress={() => doConfirm(
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
            onPress={() => doConfirm(
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

  if (status === 'accepted' || status === 'conditions_pending') {
    const accepted = exchange.conditions_accepted_by_me;
    return (
      <View style={s.actionsWrap}>
        {!accepted ? (
          <Pressable
            style={({ pressed }) => [s.primaryBtn, { backgroundColor: accent, opacity: pressed ? 0.9 : 1 }]}
            onPress={() => doConfirm(
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
            onPress={() => doConfirm(
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

  if (status === 'swap_confirmed') {
    return (
      <View style={s.actionsWrap}>
        <InfoRow icon={CheckCircle} text={t('exchanges.swapComplete', 'Swap confirmed by both parties!')} color={accent} />
        <Pressable
          style={({ pressed }) => [s.outlineBtn, { borderColor: c.text.placeholder, opacity: pressed ? 0.9 : 1 }]}
          onPress={() => doConfirm(
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

  if (status === 'return_requested') {
    const myReturnConfirmed = isRequester
      ? exchange.return_confirmed_requester
      : exchange.return_confirmed_owner;

    return (
      <View style={s.actionsWrap}>
        {!myReturnConfirmed ? (
          <Pressable
            style={({ pressed }) => [s.primaryBtn, { backgroundColor: accent, opacity: pressed ? 0.9 : 1 }]}
            onPress={() => doConfirm(
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
      <View style={[s.root, { backgroundColor: bg }]}>
        <SkeletonBookDetail />
      </View>
    );
  }

  const isChatEligible = CHAT_ELIGIBLE_STATUSES.includes(exchange.status);

  const reqColor = AVATAR_COLORS[exchange.requester.username.charCodeAt(0) % AVATAR_COLORS.length];
  const ownColor = AVATAR_COLORS[exchange.owner.username.charCodeAt(0) % AVATAR_COLORS.length];

  return (
    <View style={[s.root, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Status + date */}
        <View style={s.statusRow}>
          <ExchangeStatusBadge status={exchange.status} />
          <Text style={[s.date, { color: c.text.secondary }]}>
            {timeAgo(exchange.created_at)}
          </Text>
        </View>

        {/* Books row */}
        <View style={s.booksRow}>
          <BookPanel book={exchange.requested_book} label={t('exchanges.requested', 'Requested')} />
          <View style={s.arrowWrap}>
            <View style={[s.arrowCircle, { backgroundColor: bg, borderColor: cardBorder }]}>
              <ArrowLeftRight size={14} color={accent} />
            </View>
          </View>
          <BookPanel book={exchange.offered_book} label={t('exchanges.offered', 'Offered')} />
        </View>

        {/* Participants */}
        <View style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[s.cardLabel, { color: c.text.placeholder }]}>
            {t('exchanges.participants', 'Participants')}
          </Text>
          <View style={s.participantRow}>
            <View style={[s.pAvatar, { backgroundColor: reqColor + '20' }]}>
              <Text style={[s.pAvatarText, { color: reqColor }]}>
                {exchange.requester.username.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={s.pInfo}>
              <Text style={[s.pName, { color: c.text.primary }]}>@{exchange.requester.username}</Text>
              <Text style={[s.pRole, { color: c.text.secondary }]}>
                {t('exchanges.requester', 'Requester')} · {exchange.requester.swap_count} swaps
              </Text>
            </View>
          </View>
          <View style={[s.divider, { backgroundColor: cardBorder + '50' }]} />
          <View style={s.participantRow}>
            <View style={[s.pAvatar, { backgroundColor: ownColor + '20' }]}>
              <Text style={[s.pAvatarText, { color: ownColor }]}>
                {exchange.owner.username.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={s.pInfo}>
              <Text style={[s.pName, { color: c.text.primary }]}>@{exchange.owner.username}</Text>
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
            style={({ pressed }) => [s.chatBtn, { backgroundColor: accent, opacity: pressed ? 0.9 : 1 }]}
          >
            <MessageCircle size={18} color="#fff" />
            <Text style={s.chatBtnText}>
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

  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    marginBottom: spacing.md,
  },
  date: { fontSize: 11, fontWeight: '500' },

  booksRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  arrowWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: spacing.xs,
  },
  arrowCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  thumbWrap: {
    flex: 1,
    alignItems: 'center',
  },
  thumb: {
    width: '80%',
    aspectRatio: 0.7,
    borderRadius: radius.sm,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm + 2,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbFallback: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    color: 'rgba(255,255,255,0.85)',
    paddingHorizontal: spacing.xs,
  },
  thumbBookTitle: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  thumbLabel: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 1,
  },

  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    ...shadows.card,
  },
  cardLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: spacing.sm },

  participantRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 8 },
  pAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  pAvatarText: { fontSize: 16, fontWeight: '700' },
  pInfo: { flex: 1 },
  pName: { fontSize: 14, fontWeight: '700' },
  pRole: { fontSize: 11, marginTop: 1 },
  divider: { height: 1, marginVertical: 2 },

  messageBody: { fontSize: 14, fontStyle: 'italic', lineHeight: 22 },

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
  },
  chatBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  bottomSpacer: { height: 120 },
});
