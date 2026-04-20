import { AlertTriangle, Trash2, X } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { radius, spacing } from '@/constants/theme';
import { useColors, useIsDark } from '@/hooks/useColors';
import type { AccountDeletionPayload } from '@/types';
import { useAuthStore } from '@/stores/authStore';
import { useDeleteAccount } from '../hooks/useAccountDeletion';

interface DeleteAccountSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function DeleteAccountSheet({ visible, onClose }: DeleteAccountSheetProps) {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const deleteAccount = useDeleteAccount();
  const authProvider = useAuthStore((s) => s.user?.auth_provider);
  const isSocialOnly = !!authProvider && authProvider !== 'email';

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const sheetBg = isDark ? c.auth.bgDeep : '#fff';
  const cardBg = isDark ? c.auth.card : c.neutral[50];
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;
  const handleBg = isDark ? c.auth.cardBorder : c.neutral[300];
  const dangerColor = c.status.error;

  const resetAndClose = useCallback(() => {
    setPassword('');
    setError('');
    deleteAccount.reset();
    onClose();
  }, [onClose, deleteAccount]);

  const handleConfirm = useCallback(() => {
    if (!isSocialOnly && !password.trim()) {
      setError(t('accountDeletion.passwordRequired', 'Password is required.'));
      return;
    }
    setError('');

    deleteAccount.mutate(
      isSocialOnly ? ({ password: '' } as AccountDeletionPayload) : { password },
      {
        onError: (err) => {
          const ax = err as { response?: { data?: { password?: string[]; detail?: string } } };
          const msg =
            ax.response?.data?.password?.[0] ??
            ax.response?.data?.detail ??
            t('accountDeletion.errorMessage', 'Something went wrong. Please try again.');
          setError(msg);
        },
      },
    );
  }, [password, deleteAccount, t, isSocialOnly]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={resetAndClose}
    >
      <View style={s.backdrop}>
        <Pressable style={s.backdropTap} onPress={resetAndClose} />
        <View style={[s.sheet, { backgroundColor: sheetBg }]}>
          <View style={[s.handle, { backgroundColor: handleBg }]} />

          {/* Header */}
          <View style={s.header}>
            <View style={s.headerLeft}>
              <AlertTriangle size={20} color={dangerColor} />
              <Text style={[s.title, { color: dangerColor }]}>
                {t('accountDeletion.title', 'Delete Account')}
              </Text>
            </View>
            <Pressable onPress={resetAndClose} hitSlop={12} style={s.closeBtn}>
              <X size={20} color={c.text.secondary} />
            </Pressable>
          </View>

          {/* Warning */}
          <View style={[s.warningBox, { backgroundColor: dangerColor + '12', borderColor: dangerColor + '30' }]}>
            <Text style={[s.warningText, { color: c.text.primary }]}>
              {t(
                'accountDeletion.warning',
                'This will schedule your account for permanent deletion. You have 30 days to cancel before all your data is permanently removed.',
              )}
            </Text>
          </View>

          {/* What gets deleted */}
          <Text style={[s.detailLabel, { color: c.text.secondary }]}>
            {t('accountDeletion.whatHappens', 'What happens:')}
          </Text>
          <View style={s.bulletList}>
            <Text style={[s.bullet, { color: c.text.secondary }]}>
              {t('accountDeletion.bullet1', '• Your account will be deactivated immediately')}
            </Text>
            <Text style={[s.bullet, { color: c.text.secondary }]}>
              {t('accountDeletion.bullet2', '• Your books and exchanges will be hidden')}
            </Text>
            <Text style={[s.bullet, { color: c.text.secondary }]}>
              {t('accountDeletion.bullet3', '• After 30 days, all data is permanently erased')}
            </Text>
            <Text style={[s.bullet, { color: c.text.secondary }]}>
              {t('accountDeletion.bullet4', '• You can cancel within the 30-day window')}
            </Text>
          </View>

          {/* Password input (skip for social-only users) */}
          {!isSocialOnly && (
            <>
              <Text style={[s.inputLabel, { color: c.text.secondary }]}>
                {t('accountDeletion.confirmPassword', 'Confirm your password')}
              </Text>
              <TextInput
                style={[
                  s.input,
                  {
                    backgroundColor: cardBg,
                    borderColor: error ? dangerColor : cardBorder,
                    color: c.text.primary,
                  },
                ]}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError('');
                }}
                secureTextEntry
                placeholder={t('auth.password', 'Password')}
                placeholderTextColor={c.text.placeholder}
                textContentType="password"
                autoComplete="password"
                returnKeyType="done"
                onSubmitEditing={handleConfirm}
              />
            </>
          )}
          {!!error && (
            <Text style={[s.errorText, { color: dangerColor }]}>{error}</Text>
          )}

          {/* Actions */}
          <View style={s.actions}>
            <Pressable
              onPress={resetAndClose}
              style={({ pressed }) => [
                s.cancelBtn,
                { borderColor: cardBorder, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={[s.cancelText, { color: c.text.secondary }]}>
                {t('common.cancel', 'Cancel')}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleConfirm}
              disabled={(!isSocialOnly && !password.trim()) || deleteAccount.isPending}
              style={({ pressed }) => [
                s.deleteBtn,
                {
                  backgroundColor: dangerColor,
                  opacity: (!isSocialOnly && !password.trim()) || pressed || deleteAccount.isPending ? 0.6 : 1,
                },
              ]}
            >
              {deleteAccount.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Trash2 size={16} color="#fff" />
                  <Text style={s.deleteText}>
                    {t('accountDeletion.confirmDelete', 'Delete My Account')}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
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
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: { fontSize: 20, fontWeight: '800' },
  closeBtn: { padding: 4 },

  warningBox: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  warningText: { fontSize: 14, lineHeight: 20 },

  detailLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  bulletList: { marginBottom: spacing.md, gap: 4 },
  bullet: { fontSize: 13, lineHeight: 19 },

  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },

  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  cancelText: { fontSize: 14, fontWeight: '600' },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: radius.xl,
  },
  deleteText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
