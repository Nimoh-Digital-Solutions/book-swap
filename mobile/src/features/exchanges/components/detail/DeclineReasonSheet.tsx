import { Check, X, XCircle } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { radius, spacing } from '@/constants/theme';
import { useColors, useIsDark } from '@/hooks/useColors';
import type { DeclineReason } from '@/types';

const REASONS: DeclineReason[] = [
  'not_interested',
  'reserved',
  'counter_proposed',
  'other',
];

interface Props {
  visible: boolean;
  loading: boolean;
  onClose: () => void;
  onDecline: (reason?: DeclineReason) => void;
}

export function DeclineReasonSheet({ visible, loading, onClose, onDecline }: Props) {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();

  const [selected, setSelected] = useState<DeclineReason | null>(null);

  const sheetBg = isDark ? c.auth.bgDeep : '#fff';
  const cardBg = isDark ? c.auth.card : c.neutral[50];
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;
  const handleBg = isDark ? c.auth.cardBorder : c.neutral[300];
  const dangerColor = '#EF4444';

  const resetAndClose = useCallback(() => {
    setSelected(null);
    onClose();
  }, [onClose]);

  const handleDecline = useCallback(() => {
    onDecline(selected ?? undefined);
  }, [selected, onDecline]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={resetAndClose}
    >
      <View style={s.backdrop}>
        <Pressable
          style={s.backdropTap}
          onPress={resetAndClose}
          accessibilityRole="button"
          accessibilityLabel={t('exchanges.a11y.dismissDeclineSheet', 'Dismiss')}
        />
        <View style={[s.sheet, { backgroundColor: sheetBg }]}>
          <View style={[s.handle, { backgroundColor: handleBg }]} />

          <View style={s.header}>
            <View style={s.headerLeft}>
              <XCircle size={20} color={dangerColor} />
              <Text style={[s.title, { color: c.text.primary }]}>
                {t('exchanges.declineTitle', 'Decline Request')}
              </Text>
            </View>
            <Pressable
              onPress={resetAndClose}
              hitSlop={12}
              style={s.closeBtn}
              accessibilityRole="button"
              accessibilityLabel={t('common.close', 'Close')}
            >
              <X size={20} color={c.text.secondary} />
            </Pressable>
          </View>

          <Text style={[s.subtitle, { color: c.text.secondary }]}>
            {t('exchanges.declineReasonSubtitle', 'Optionally select a reason. The requester will be notified.')}
          </Text>

          <ScrollView style={s.list} showsVerticalScrollIndicator={false} bounces>
            {REASONS.map((reason) => {
              const isSelected = selected === reason;
              return (
                <Pressable
                  key={reason}
                  onPress={() => setSelected(isSelected ? null : reason)}
                  accessibilityRole="button"
                  accessibilityLabel={t(`exchanges.declineReasons.${reason}`, reason)}
                  style={[
                    s.reasonRow,
                    {
                      backgroundColor: isSelected ? dangerColor + '14' : cardBg,
                      borderColor: isSelected ? dangerColor : cardBorder,
                    },
                  ]}
                >
                  <View
                    style={[
                      s.radio,
                      {
                        borderColor: isSelected ? dangerColor : cardBorder,
                        backgroundColor: isSelected ? dangerColor : 'transparent',
                      },
                    ]}
                  >
                    {isSelected && <Check size={12} color="#fff" strokeWidth={3} />}
                  </View>
                  <Text
                    style={[
                      s.reasonLabel,
                      { color: isSelected ? c.text.primary : c.text.secondary },
                    ]}
                  >
                    {t(`exchanges.declineReasons.${reason}`, reason)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable
            style={({ pressed }) => [
              s.declineBtn,
              {
                backgroundColor: dangerColor,
                opacity: pressed || loading ? 0.7 : 1,
              },
            ]}
            onPress={handleDecline}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={t('exchanges.decline', 'Decline')}
          >
            {loading ? (
              <ActivityIndicator size="small" color={c.text.inverse} />
            ) : (
              <>
                <XCircle size={16} color="#fff" />
                <Text style={s.declineBtnText}>
                  {t('exchanges.decline', 'Decline')}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  backdropTap: { flex: 1 },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl + 16,
    paddingTop: spacing.sm,
    maxHeight: '70%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: { fontSize: 20, fontWeight: '800' },
  closeBtn: { padding: 4 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: spacing.md },

  list: { flexShrink: 1, marginBottom: spacing.md },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonLabel: { fontSize: 14, fontWeight: '600', flex: 1 },

  declineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: radius.xl,
  },
  declineBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
