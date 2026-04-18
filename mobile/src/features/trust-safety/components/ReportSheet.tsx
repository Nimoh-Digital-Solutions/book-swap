import { Flag, X, Check, AlertTriangle } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { radius, spacing } from '@/constants/theme';
import { useColors, useIsDark } from '@/hooks/useColors';
import type { ReportCategory } from '@/types';
import { useReportUser } from '../hooks/useReports';

const CATEGORIES: ReportCategory[] = [
  'inappropriate',
  'fake_listing',
  'no_show',
  'misrepresented',
  'harassment',
  'spam',
  'other',
];

interface ReportSheetProps {
  visible: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedBookId?: string;
  reportedExchangeId?: string;
}

export function ReportSheet({
  visible,
  onClose,
  reportedUserId,
  reportedBookId,
  reportedExchangeId,
}: ReportSheetProps) {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const report = useReportUser();

  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [description, setDescription] = useState('');

  const sheetBg = isDark ? c.auth.bgDeep : '#fff';
  const cardBg = isDark ? c.auth.card : c.neutral[50];
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;
  const accent = c.auth.golden;
  const handleBg = isDark ? c.auth.cardBorder : c.neutral[300];

  const descriptionRequired = category === 'other';
  const canSubmit =
    category !== null && (!descriptionRequired || description.trim().length > 0);

  const resetAndClose = useCallback(() => {
    setCategory(null);
    setDescription('');
    report.reset();
    onClose();
  }, [onClose, report]);

  const handleSubmit = useCallback(() => {
    if (!category || !canSubmit) return;

    report.mutate(
      {
        reported_user_id: reportedUserId,
        reported_book_id: reportedBookId,
        reported_exchange_id: reportedExchangeId,
        category,
        description: description.trim() || undefined,
      },
      {
        onSuccess: () => {
          Alert.alert(
            t('report.successTitle', 'Report Submitted'),
            t('report.successMessage', 'Thank you. Our team will review your report.'),
            [{ text: t('common.done', 'OK'), onPress: resetAndClose }],
          );
        },
        onError: (err) => {
          const is403 = (err as any)?.response?.status === 403;
          const message = is403
            ? t('report.emailNotVerified', 'You need to verify your email before reporting.')
            : t('report.errorMessage', 'Something went wrong. Please try again.');
          Alert.alert(t('common.error', 'Error'), message);
        },
      },
    );
  }, [
    category,
    canSubmit,
    report,
    reportedUserId,
    reportedBookId,
    reportedExchangeId,
    description,
    t,
    resetAndClose,
  ]);

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
          accessibilityRole="button"
          accessibilityLabel={t('report.dismissA11y', 'Dismiss report dialog')}
          onPress={resetAndClose}
        />
        <View style={[s.sheet, { backgroundColor: sheetBg }]}>
          <View style={[s.handle, { backgroundColor: handleBg }]} />

          {/* Header */}
          <View style={s.header}>
            <View style={s.headerLeft}>
              <Flag size={20} color={accent} />
              <Text style={[s.title, { color: c.text.primary }]}>
                {t('report.title', 'Report User')}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.close', 'Close')}
              onPress={resetAndClose}
              hitSlop={12}
              style={s.closeBtn}
            >
              <X size={20} color={c.text.secondary} />
            </Pressable>
          </View>

          <Text style={[s.subtitle, { color: c.text.secondary }]}>
            {t(
              'report.subtitle',
              'Select a reason for your report. Our team will review it within 24 hours.',
            )}
          </Text>

          {/* Category list */}
          <ScrollView
            style={s.list}
            showsVerticalScrollIndicator={false}
            bounces
          >
            {CATEGORIES.map((cat) => {
              const selected = category === cat;
              return (
                <Pressable
                  key={cat}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={t(`report.categories.${cat}`, cat)}
                  onPress={() => setCategory(cat)}
                  style={[
                    s.categoryRow,
                    {
                      backgroundColor: selected ? accent + '14' : cardBg,
                      borderColor: selected ? accent : cardBorder,
                    },
                  ]}
                >
                  <View
                    style={[
                      s.radio,
                      {
                        borderColor: selected ? accent : cardBorder,
                        backgroundColor: selected ? accent : 'transparent',
                      },
                    ]}
                  >
                    {selected && <Check size={12} color="#fff" strokeWidth={3} />}
                  </View>
                  <Text
                    style={[
                      s.categoryLabel,
                      { color: selected ? c.text.primary : c.text.secondary },
                    ]}
                  >
                    {t(`report.categories.${cat}`, cat)}
                  </Text>
                </Pressable>
              );
            })}

            {/* Description */}
            {category && (
              <View style={s.descriptionWrap}>
                <Text style={[s.descLabel, { color: c.text.secondary }]}>
                  {t('report.descriptionLabel', 'Additional details')}
                  {descriptionRequired && (
                    <Text style={{ color: c.status.error }}> *</Text>
                  )}
                </Text>
                <TextInput
                  style={[
                    s.descInput,
                    {
                      backgroundColor: cardBg,
                      borderColor: cardBorder,
                      color: c.text.primary,
                    },
                  ]}
                  value={description}
                  onChangeText={(text) => setDescription(text.slice(0, 500))}
                  maxLength={500}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  placeholder={t(
                    'report.descriptionPlaceholder',
                    'Describe what happened...',
                  )}
                  placeholderTextColor={c.text.placeholder}
                />
                <Text style={[s.charCount, { color: c.text.placeholder }]}>
                  {description.length}/500
                </Text>
                {descriptionRequired && !description.trim() && (
                  <View style={s.requiredRow}>
                    <AlertTriangle size={12} color={c.status.error} />
                    <Text style={[s.requiredText, { color: c.status.error }]}>
                      {t(
                        'report.descriptionRequired',
                        'A description is required for "Other".',
                      )}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Submit */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('report.submit', 'Submit Report')}
            accessibilityState={{ disabled: !canSubmit || report.isPending }}
            style={({ pressed }) => [
              s.submitBtn,
              {
                backgroundColor: accent,
                opacity: !canSubmit || pressed || report.isPending ? 0.6 : 1,
              },
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit || report.isPending}
          >
            {report.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Flag size={16} color="#fff" />
                <Text style={s.submitText}>
                  {t('report.submit', 'Submit Report')}
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
  categoryRow: {
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
  categoryLabel: { fontSize: 14, fontWeight: '600', flex: 1 },

  descriptionWrap: { marginTop: spacing.xs },
  descLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  descInput: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 80,
  },
  charCount: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
  },
  requiredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  requiredText: { fontSize: 12, fontWeight: '500' },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: radius.xl,
  },
  submitText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
