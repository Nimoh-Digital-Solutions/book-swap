import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AlertTriangle, Loader2, Lock } from 'lucide-react';

import { useDeleteAccount } from '../../hooks/useDeleteAccount';

export interface DeleteAccountDialogProps {
  open: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

export function DeleteAccountDialog({
  open,
  onClose,
  onDeleted,
}: DeleteAccountDialogProps): ReactElement | null {
  const { t } = useTranslation();
  const deleteAccount = useDeleteAccount();
  const [password, setPassword] = useState('');

  if (!open) return null;

  const handleConfirm = () => {
    if (!password.trim()) return;
    deleteAccount.mutate(
      { password },
      {
        onSuccess: (data) => {
          if (data.cancel_token) {
            localStorage.setItem('bs_deletion_cancel_token', data.cancel_token);
          }
          onDeleted?.();
        },
      },
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center pt-4 px-4 pb-safe"
      style={{
        // Adds the iOS home-indicator inset to the existing 1rem
        // bottom padding (RESP-006). See tailwind.css `*-safe` utilities.
        ['--pb' as string]: '1rem',
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        className="relative w-full max-w-md bg-[#1A251D] rounded-2xl border border-[#28382D] p-6 space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" aria-hidden="true" />
          </div>
          <h2 id="delete-dialog-title" className="text-lg font-bold text-white">
            {t('profile.delete.title', 'Delete Account')}
          </h2>
        </div>

        <p className="text-sm text-[#8C9C92] leading-relaxed">
          {t(
            'profile.delete.warning',
            'This will permanently delete your account, all your book listings, exchange history, and messages. This cannot be undone.',
          )}
        </p>

        <p className="text-sm text-[#8C9C92]">
          {t(
            'profile.delete.gracePeriod',
            'You will have 30 days to cancel before your data is permanently anonymized.',
          )}
        </p>

        {/* Password input */}
        <div>
          <label htmlFor="delete-password" className="block text-sm font-medium text-[#8C9C92] mb-1">
            {t('profile.delete.passwordLabel', 'Enter your password to confirm')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="w-4 h-4 text-[#5A6A60]" aria-hidden="true" />
            </div>
            <input
              id="delete-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-[#28382D] rounded-xl text-base sm:text-sm bg-[#152018] text-white placeholder-[#5A6A60] focus:ring-red-500 focus:border-red-500"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
        </div>

        {deleteAccount.isError && (
          <p className="text-sm text-red-400" role="alert">
            {t('profile.delete.error', 'Failed to delete account. Please check your password and try again.')}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-[#28382D] text-[#8C9C92] hover:text-white hover:border-[#E4B643] transition-colors"
          >
            {t('common.cancel', 'Cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!password.trim() || deleteAccount.isPending}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleteAccount.isPending && (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            )}
            {t('profile.delete.confirm', 'Delete Account')}
          </button>
        </div>
      </div>
    </div>
  );
}
