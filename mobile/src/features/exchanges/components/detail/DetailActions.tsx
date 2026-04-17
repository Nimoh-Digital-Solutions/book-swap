import {
  AlertCircle,
  ArrowLeftRight,
  CheckCircle,
  Clock,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { useAuthStore } from '@/stores/authStore';
import type { ExchangeDetail } from '@/types';
import {
  useAcceptConditions,
  useAcceptExchange,
  useCancelExchange,
  useConfirmReturn,
  useConfirmSwap,
  useDeclineExchange,
  useRequestReturn,
} from '../../hooks/useExchanges';

function InfoRow({ icon: Icon, text, color }: { icon: any; text: string; color: string }) {
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
  const currentUserId = useAuthStore((st) => st.user?.id);
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
        <View style={s.wrap}>
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
        <View style={s.wrap}>
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
      <View style={s.wrap}>
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
    const myConfirmed = isRequester ? exchange.requester_confirmed_at : exchange.owner_confirmed_at;
    const partnerConfirmed = isRequester ? exchange.owner_confirmed_at : exchange.requester_confirmed_at;

    return (
      <View style={s.wrap}>
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
    return (
      <View style={s.wrap}>
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
    const myReturnConfirmed = isRequester ? exchange.return_confirmed_requester : exchange.return_confirmed_owner;
    return (
      <View style={s.wrap}>
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

  if (status === 'declined') return <InfoRow icon={XCircle} text={t('exchanges.wasDeclined', 'This request was declined.')} color="#EF4444" />;
  if (status === 'cancelled') return <InfoRow icon={XCircle} text={t('exchanges.wasCancelled', 'This request was cancelled.')} color={c.text.placeholder} />;
  if (status === 'expired') return <InfoRow icon={AlertCircle} text={t('exchanges.wasExpired', 'This request expired.')} color={c.text.placeholder} />;
  if (status === 'returned') return <InfoRow icon={CheckCircle} text={t('exchanges.booksReturned', 'Books have been returned.')} color={accent} />;
  if (status === 'completed') return <InfoRow icon={CheckCircle} text={t('exchanges.completed', 'Exchange completed!')} color={accent} />;

  return null;
}

const s = StyleSheet.create({
  wrap: { gap: spacing.sm },
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
