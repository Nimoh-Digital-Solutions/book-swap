import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  AlertCircle,
  ArrowLeftRight,
  CheckCircle,
  Clock,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { hapticNotification } from '@/lib/haptics';
import type { MessagesStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/stores/authStore';
import type { DeclineReason, ExchangeDetail } from '@/types';
import {
  useAcceptConditions,
  useAcceptExchange,
  useApproveCounter,
  useCancelExchange,
  useCompleteExchange,
  useConfirmReturn,
  useConfirmSwap,
  useDeclineExchange,
  useRequestReturn,
} from '../../hooks/useExchanges';
import { ConditionsReviewModal } from './ConditionsReviewModal';
import { DeclineReasonSheet } from './DeclineReasonSheet';

function InfoRow({ icon: Icon, text, color }: { icon: React.ComponentType<{ size?: number; color?: string }>; text: string; color: string }) {
  return (
    <View style={s.infoRow}>
      <Icon size={16} color={color} />
      <Text style={[s.infoText, { color }]}>{text}</Text>
    </View>
  );
}

interface Props {
  exchange: ExchangeDetail;
}

export function DetailActions({ exchange }: Props) {
  const { t } = useTranslation();
  const c = useColors();
  const navigation = useNavigation<NativeStackNavigationProp<MessagesStackParamList>>();
  const currentUserId = useAuthStore((st) => st.user?.id);
  const accent = c.auth.golden;

  const isOwner = currentUserId === exchange.owner.id;
  const isRequester = currentUserId === exchange.requester.id;

  const [conditionsVisible, setConditionsVisible] = useState(false);
  const [declineSheetVisible, setDeclineSheetVisible] = useState(false);

  const acceptMutation = useAcceptExchange();
  const declineMutation = useDeclineExchange();
  const cancelMutation = useCancelExchange();
  const approveCounter = useApproveCounter();
  const acceptConditions = useAcceptConditions();
  const confirmSwap = useConfirmSwap();
  const completeExchange = useCompleteExchange();
  const requestReturn = useRequestReturn();
  const confirmReturn = useConfirmReturn();

  const doConfirm = (title: string, msg: string, onConfirm: () => void, destructive = false) => {
    void hapticNotification(destructive ? 'warning' : 'success');
    Alert.alert(title, msg, [
      { text: t('common.cancel', 'Cancel'), style: 'cancel' },
      { text: t('common.confirm', 'Confirm'), style: destructive ? 'destructive' : 'default', onPress: onConfirm },
    ]);
  };

  const handleDecline = (reason?: DeclineReason) => {
    declineMutation.mutate(
      { exchangeId: exchange.id, payload: reason ? { reason } : undefined },
      { onSuccess: () => setDeclineSheetVisible(false) },
    );
  };

  const status = exchange.status;

  if (status === 'pending') {
    const hasBeenCountered = !!exchange.last_counter_by;
    const counterApproved = !!exchange.counter_approved_at;
    const iMadeLastCounter = exchange.last_counter_by === currentUserId;
    const pendingApproval = hasBeenCountered && !counterApproved;
    const maxCounterOffers = exchange.max_counter_offers;
    const myCounterCount = isRequester ? exchange.requester_counter_count : exchange.owner_counter_count;
    const countersRemaining = exchange.counter_offers_remaining_by_me;
    const counterLimitReached = countersRemaining <= 0;

    const canOwnerCounter = (!hasBeenCountered || !iMadeLastCounter) && !counterLimitReached;
    const canRequesterCounter = hasBeenCountered && !iMadeLastCounter && !counterLimitReached;
    const canAccept = !pendingApproval;

    const otherUser = isOwner ? exchange.requester : exchange.owner;

    if (isOwner) {
      return (
        <View style={s.wrap}>
          {/* Approve counter (when requester countered and owner hasn't approved) */}
          {pendingApproval && !iMadeLastCounter && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('exchanges.approveCounter', 'Approve Counter')}
              style={({ pressed }) => [s.primaryBtn, { backgroundColor: accent, opacity: pressed ? 0.9 : 1 }]}
              onPress={() => doConfirm(
                t('exchanges.approveCounterTitle', 'Approve Counter?'),
                t('exchanges.approveCounterMsg', 'Agree to the new book selection before accepting the exchange.'),
                () => approveCounter.mutate(exchange.id),
              )}
            >
              <CheckCircle size={16} color="#fff" />
              <Text style={s.primaryBtnText}>{t('exchanges.approveCounter', 'Approve Counter')}</Text>
            </Pressable>
          )}

          {/* Waiting for other party to approve my counter */}
          {pendingApproval && iMadeLastCounter && (
            <InfoRow
              icon={Clock}
              text={t('exchanges.waitingCounterApproval', {
                defaultValue: 'Waiting for @{{name}} to approve your counter offer...',
                name: otherUser.username,
              })}
              color={c.text.secondary}
            />
          )}

          {/* Accept / Decline row */}
          {canAccept && (
            <View style={s.ownerRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('exchanges.accept', 'Accept')}
                style={({ pressed }) => [s.rowBtn, { backgroundColor: accent, opacity: pressed ? 0.9 : 1 }]}
                onPress={() => doConfirm(
                  t('exchanges.acceptTitle', 'Accept Request?'),
                  t('exchanges.acceptMsg', 'Other pending requests for this book will be automatically declined.'),
                  () => acceptMutation.mutate(exchange.id),
                )}
              >
                <CheckCircle size={16} color="#fff" />
                <Text style={s.rowBtnText}>{t('exchanges.accept', 'Accept')}</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('exchanges.decline', 'Decline')}
                style={({ pressed }) => [s.rowBtn, s.rowBtnOutline, { borderColor: '#EF4444', opacity: pressed ? 0.9 : 1 }]}
                onPress={() => setDeclineSheetVisible(true)}
              >
                <XCircle size={16} color="#EF4444" />
                <Text style={[s.rowBtnText, { color: '#EF4444' }]}>{t('exchanges.decline', 'Decline')}</Text>
              </Pressable>
            </View>
          )}

          {/* Decline only (when waiting for approval, owner can still decline) */}
          {!canAccept && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('exchanges.decline', 'Decline')}
              style={({ pressed }) => [s.outlineBtn, { borderColor: '#EF4444', opacity: pressed ? 0.9 : 1 }]}
              onPress={() => setDeclineSheetVisible(true)}
            >
              <XCircle size={16} color="#EF4444" />
              <Text style={[s.outlineBtnText, { color: '#EF4444' }]}>{t('exchanges.decline', 'Decline')}</Text>
            </Pressable>
          )}

          {canOwnerCounter && !pendingApproval && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('exchanges.counterOffer', 'Counter Offer')}
              style={({ pressed }) => [s.outlineBtn, { borderColor: accent, opacity: pressed ? 0.9 : 1 }]}
              onPress={() =>
                navigation.navigate('CounterOffer', {
                  exchangeId: exchange.id,
                  requesterId: otherUser.id,
                  requesterName: otherUser.username,
                })
              }
            >
              <RefreshCw size={16} color={accent} />
              <Text style={[s.outlineBtnText, { color: accent }]}>
                {t('exchanges.counterOffer', 'Counter Offer')}
              </Text>
            </Pressable>
          )}

          {counterLimitReached && !pendingApproval && (
            <InfoRow
              icon={AlertCircle}
              text={t('exchanges.counterLimitReached', {
                defaultValue: 'Counter offer limit reached ({{count}}/{{max}}).',
                count: myCounterCount,
                max: maxCounterOffers,
              })}
              color={c.text.secondary}
            />
          )}

          <DeclineReasonSheet
            visible={declineSheetVisible}
            loading={declineMutation.isPending}
            onClose={() => setDeclineSheetVisible(false)}
            onDecline={handleDecline}
          />
        </View>
      );
    }
    if (isRequester) {
      return (
        <View style={s.wrap}>
          {/* Approve counter (when owner countered and requester hasn't approved) */}
          {pendingApproval && !iMadeLastCounter && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('exchanges.approveCounter', 'Approve Counter')}
              style={({ pressed }) => [s.primaryBtn, { backgroundColor: accent, opacity: pressed ? 0.9 : 1 }]}
              onPress={() => doConfirm(
                t('exchanges.approveCounterTitle', 'Approve Counter?'),
                t('exchanges.approveCounterMsg', 'Agree to the new book selection before the exchange can proceed.'),
                () => approveCounter.mutate(exchange.id),
              )}
            >
              <CheckCircle size={16} color="#fff" />
              <Text style={s.primaryBtnText}>{t('exchanges.approveCounter', 'Approve Counter')}</Text>
            </Pressable>
          )}

          {/* Waiting for other party to approve my counter */}
          {pendingApproval && iMadeLastCounter && (
            <InfoRow
              icon={Clock}
              text={t('exchanges.waitingCounterApproval', {
                defaultValue: 'Waiting for @{{name}} to approve your counter offer...',
                name: otherUser.username,
              })}
              color={c.text.secondary}
            />
          )}

          {canRequesterCounter && !pendingApproval && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('exchanges.counterOffer', 'Counter Offer')}
              style={({ pressed }) => [s.outlineBtn, { borderColor: accent, opacity: pressed ? 0.9 : 1 }]}
              onPress={() =>
                navigation.navigate('CounterOffer', {
                  exchangeId: exchange.id,
                  requesterId: otherUser.id,
                  requesterName: otherUser.username,
                })
              }
            >
              <RefreshCw size={16} color={accent} />
              <Text style={[s.outlineBtnText, { color: accent }]}>
                {t('exchanges.counterOffer', 'Counter Offer')}
              </Text>
            </Pressable>
          )}
          {counterLimitReached && !pendingApproval && (
            <InfoRow
              icon={AlertCircle}
              text={t('exchanges.counterLimitReached', {
                defaultValue: 'Counter offer limit reached ({{count}}/{{max}}).',
                count: myCounterCount,
                max: maxCounterOffers,
              })}
              color={c.text.secondary}
            />
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('exchanges.cancelRequest', 'Cancel Request')}
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
          {!hasBeenCountered && (
            <InfoRow icon={Clock} text={t('exchanges.waitingOwner', 'Waiting for the owner to respond...')} color={c.text.secondary} />
          )}
        </View>
      );
    }
  }

  if (status === 'accepted' || status === 'conditions_pending') {
    const accepted = exchange.conditions_accepted_by_me;
    return (
      <View style={s.wrap}>
        {!accepted ? (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('exchanges.reviewConditions', 'Review Exchange Conditions')}
              style={({ pressed }) => [s.primaryBtn, { backgroundColor: accent, opacity: pressed ? 0.9 : 1 }]}
              onPress={() => setConditionsVisible(true)}
            >
              <ShieldCheck size={16} color="#fff" />
              <Text style={s.primaryBtnText}>
                {t('exchanges.reviewConditions', 'Review Exchange Conditions')}
              </Text>
            </Pressable>
            <ConditionsReviewModal
              visible={conditionsVisible}
              loading={acceptConditions.isPending}
              onClose={() => setConditionsVisible(false)}
              onAccept={() =>
                acceptConditions.mutate(exchange.id, {
                  onSuccess: () => setConditionsVisible(false),
                })
              }
            />
          </>
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
    const myConfirmed = isRequester ? exchange.requester_confirmed_at : exchange.owner_confirmed_at;
    const partnerConfirmed = isRequester ? exchange.owner_confirmed_at : exchange.requester_confirmed_at;

    return (
      <View style={s.wrap}>
        {!myConfirmed ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('exchanges.confirmSwap', 'Confirm Swap')}
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
          <InfoRow icon={CheckCircle} text={t('exchanges.youConfirmed', 'You confirmed the swap.')} color={accent} />
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
    const isPermanent = exchange.swap_type === 'permanent';
    return (
      <View style={s.wrap}>
        <InfoRow icon={CheckCircle} text={t('exchanges.swapComplete', 'Swap confirmed by both parties!')} color={accent} />
        {isPermanent ? (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('exchanges.completeExchange', 'Complete Exchange')}
              style={({ pressed }) => [s.primaryBtn, { backgroundColor: accent, opacity: pressed ? 0.9 : 1 }]}
              onPress={() => doConfirm(
                t('exchanges.completeTitle', 'Complete Exchange?'),
                t('exchanges.completeMsg', 'This will finalize the exchange and transfer book ownership permanently.'),
                () => completeExchange.mutate(exchange.id),
              )}
            >
              <CheckCircle size={16} color="#fff" />
              <Text style={s.primaryBtnText}>{t('exchanges.completeExchange', 'Complete Exchange')}</Text>
            </Pressable>
            <InfoRow
              icon={ArrowLeftRight}
              text={t('exchanges.permanentSwapNote', 'This is a permanent swap — no return needed.')}
              color={c.text.secondary}
            />
          </>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('exchanges.requestReturn', 'Request Return')}
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
        )}
      </View>
    );
  }

  if (status === 'return_requested') {
    const myReturnConfirmed = isRequester ? exchange.return_confirmed_requester : exchange.return_confirmed_owner;
    return (
      <View style={s.wrap}>
        {!myReturnConfirmed ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('exchanges.confirmReturn', 'Confirm Return')}
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
    const reasonKey = exchange.decline_reason
      ? t(`exchanges.declineReasons.${exchange.decline_reason}`, exchange.decline_reason)
      : null;
    return (
      <View style={s.wrap}>
        <InfoRow icon={XCircle} text={t('exchanges.wasDeclined', 'This request was declined.')} color="#EF4444" />
        {reasonKey && (
          <InfoRow
            icon={XCircle}
            text={t('exchanges.declineReasonLabel', { defaultValue: 'Reason: {{reason}}', reason: reasonKey })}
            color={c.text.secondary}
          />
        )}
      </View>
    );
  }
  if (status === 'cancelled') return <InfoRow icon={XCircle} text={t('exchanges.wasCancelled', 'This request was cancelled.')} color={c.text.placeholder} />;
  if (status === 'expired') return <InfoRow icon={AlertCircle} text={t('exchanges.wasExpired', 'This request expired.')} color={c.text.placeholder} />;
  if (status === 'returned') return <InfoRow icon={CheckCircle} text={t('exchanges.booksReturned', 'Books have been returned.')} color={accent} />;
  if (status === 'completed') return <InfoRow icon={CheckCircle} text={t('exchanges.completed', 'Exchange completed!')} color={accent} />;

  return null;
}

const s = StyleSheet.create({
  wrap: { gap: spacing.sm },

  ownerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rowBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: radius.xl,
  },
  rowBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  rowBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

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
});
