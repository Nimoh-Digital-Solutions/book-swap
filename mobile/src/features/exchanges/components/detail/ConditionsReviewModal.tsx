import { ShieldCheck, X } from 'lucide-react-native';
import React from 'react';
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

interface Props {
  visible: boolean;
  loading: boolean;
  onClose: () => void;
  onAccept: () => void;
}

const CONDITION_KEYS = [
  'condition_care',
  'condition_timeframe',
  'condition_communication',
  'condition_honesty',
  'condition_return',
] as const;

export function ConditionsReviewModal({ visible, loading, onClose, onAccept }: Props) {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();

  const sheetBg = isDark ? c.auth.bgDeep : '#fff';
  const cardBg = isDark ? c.auth.card : c.neutral[50];
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;
  const accent = c.auth.golden;
  const handleBg = isDark ? c.auth.cardBorder : c.neutral[300];

  const conditions: { title: string; body: string }[] = CONDITION_KEYS.map((key) => ({
    title: t(`exchanges.conditions.${key}_title`, { defaultValue: fallbackTitles[key] }),
    body: t(`exchanges.conditions.${key}_body`, { defaultValue: fallbackBodies[key] }),
  }));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <Pressable style={s.backdropTap} onPress={onClose} />
        <View style={[s.sheet, { backgroundColor: sheetBg }]}>
          <View style={[s.handle, { backgroundColor: handleBg }]} />

          <View style={s.header}>
            <View style={s.headerLeft}>
              <ShieldCheck size={20} color={accent} />
              <Text style={[s.title, { color: c.text.primary }]}>
                {t('exchanges.reviewConditions', 'Exchange Conditions')}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={s.closeBtn}>
              <X size={20} color={c.text.secondary} />
            </Pressable>
          </View>

          <Text style={[s.subtitle, { color: c.text.secondary }]}>
            {t(
              'exchanges.conditionsIntro',
              'Please review and accept the following conditions before proceeding with this exchange.',
            )}
          </Text>

          <ScrollView style={s.list} showsVerticalScrollIndicator={false} bounces>
            {conditions.map((item, i) => (
              <View
                key={CONDITION_KEYS[i]}
                style={[s.conditionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
              >
                <Text style={[s.conditionNum, { color: accent }]}>{i + 1}</Text>
                <View style={s.conditionContent}>
                  <Text style={[s.conditionTitle, { color: c.text.primary }]}>{item.title}</Text>
                  <Text style={[s.conditionBody, { color: c.text.secondary }]}>{item.body}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <Pressable
            style={({ pressed }) => [
              s.acceptBtn,
              { backgroundColor: accent, opacity: pressed || loading ? 0.85 : 1 },
            ]}
            onPress={onAccept}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <ShieldCheck size={16} color="#fff" />
                <Text style={s.acceptBtnText}>
                  {t('exchanges.iAcceptConditions', 'I Accept')}
                </Text>
              </>
            )}
          </Pressable>

          <Text style={[s.version, { color: c.text.placeholder }]}>
            {t('exchanges.conditionsVersion', 'Conditions v1.0')}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const fallbackTitles: Record<string, string> = {
  condition_care: 'Handle books with care',
  condition_timeframe: 'Complete swaps promptly',
  condition_communication: 'Communicate clearly',
  condition_honesty: 'Be honest about condition',
  condition_return: 'Return if requested',
};

const fallbackBodies: Record<string, string> = {
  condition_care:
    'Treat borrowed books as if they were your own. Avoid damage, stains, or excessive wear.',
  condition_timeframe:
    'Respond to swap requests within 48 hours and arrange the physical exchange within 7 days of acceptance.',
  condition_communication:
    'Keep the other party informed about meetup times, delays, or any issues through the in-app chat.',
  condition_honesty:
    'Accurately describe your book\'s condition. If there is damage, mention it upfront.',
  condition_return:
    'If a return is requested, arrange to return the book in the same condition you received it.',
};

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  backdropTap: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl + 16,
    paddingTop: spacing.sm,
    maxHeight: '85%',
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
  conditionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  conditionNum: {
    fontSize: 18,
    fontWeight: '800',
    width: 24,
    textAlign: 'center',
    marginTop: 2,
  },
  conditionContent: { flex: 1, gap: 4 },
  conditionTitle: { fontSize: 14, fontWeight: '700' },
  conditionBody: { fontSize: 13, lineHeight: 19 },

  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: radius.xl,
  },
  acceptBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  version: { fontSize: 11, textAlign: 'center', marginTop: spacing.sm },
});
