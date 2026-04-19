import { type ReactElement, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppStore } from '@data/useAppStore';
import { NotificationPreferencesSection } from '@features/notifications';
import { profileService,useProfile } from '@features/profile';
import { DeleteAccountDialog } from '@features/profile/components/DeleteAccountDialog';
import { PasswordChangeSection } from '@features/profile/components/PasswordChangeSection/PasswordChangeSection';
import { PrivacySection } from '@features/profile/components/PrivacySection/PrivacySection';
import {
  BlockedUsersList,
  DataExportButton,
} from '@features/trust-safety';
import { useDocumentTitle } from '@hooks';
import { routeMetadata } from '@routes/config/paths';
import { PATHS } from '@routes/config/paths';
import { AlertTriangle, Loader2, Shield, Trash2 } from 'lucide-react';

export default function SettingsPage(): ReactElement {
  const { t } = useTranslation();
  useDocumentTitle(routeMetadata[PATHS.SETTINGS].title);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const addNotification = useAppStore(s => s.addNotification);
  const { data: profile, refetch } = useProfile();

  const isPendingDeletion = !!profile?.deletion_requested_at;

  const handleCancelDeletion = useCallback(async () => {
    const token = localStorage.getItem('bs_deletion_cancel_token');
    if (!token) {
      addNotification(
        t('settings.cancelDeletion.noToken', 'No cancellation token found. Please use the link from your email.'),
        { variant: 'error' },
      );
      return;
    }
    setCancelling(true);
    try {
      await profileService.cancelDeletion({ token });
      localStorage.removeItem('bs_deletion_cancel_token');
      addNotification(t('settings.cancelDeletion.success', 'Account deletion cancelled.'), { variant: 'success' });
      void refetch();
    } catch {
      addNotification(t('settings.cancelDeletion.error', 'Failed to cancel deletion.'), { variant: 'error' });
    } finally {
      setCancelling(false);
    }
  }, [addNotification, t, refetch]);

  // Only show password-change section for email-authenticated users
  const isEmailUser = !profile?.auth_provider || profile.auth_provider === 'email';

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold text-white">
        {t('settings.heading', 'Settings')}
      </h1>

      {/* Notification Preferences */}
      <NotificationPreferencesSection />

      {/* Privacy & Visibility */}
      <PrivacySection />

      {/* Password Change (email users only) */}
      {isEmailUser && <PasswordChangeSection />}

      {/* Blocked Users */}
      <div className="bg-[#1A251D] rounded-2xl border border-[#28382D] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#E4B643]" aria-hidden="true" />
          <h2 className="text-lg font-bold text-white">
            {t('settings.blockedUsers', 'Blocked Users')}
          </h2>
        </div>
        <BlockedUsersList />
      </div>

      {/* Data Export */}
      <div className="bg-[#1A251D] rounded-2xl border border-[#28382D] p-6 space-y-4">
        <h2 className="text-lg font-bold text-white">
          {t('settings.dataExport', 'Your Data')}
        </h2>
        <p className="text-sm text-[#8C9C92]">
          {t(
            'settings.dataExportDescription',
            'Download a copy of all your personal data stored on BookSwap.',
          )}
        </p>
        <DataExportButton />
      </div>

      {/* Pending deletion banner */}
      {isPendingDeletion && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" aria-hidden="true" />
            <h2 className="text-lg font-bold text-amber-400">
              {t('settings.pendingDeletion', 'Account Deletion Pending')}
            </h2>
          </div>
          <p className="text-sm text-[#8C9C92]">
            {t(
              'settings.pendingDeletionDesc',
              'Your account is scheduled for deletion. You can cancel within 30 days.',
            )}
          </p>
          <button
            type="button"
            onClick={handleCancelDeletion}
            disabled={cancelling}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-amber-500 text-[#152018] hover:bg-amber-400 transition-colors disabled:opacity-50"
          >
            {cancelling && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            {t('settings.cancelDeletion.button', 'Cancel Deletion')}
          </button>
        </div>
      )}

      {/* Danger zone */}
      {!isPendingDeletion && (
        <div className="bg-[#1A251D] rounded-2xl border border-red-500/30 p-6 space-y-4">
          <h2 className="text-lg font-bold text-red-400">
            {t('settings.dangerZone', 'Danger Zone')}
          </h2>
          <p className="text-sm text-[#8C9C92]">
            {t(
              'settings.deleteDescription',
              'Once you delete your account, there is no going back. You will have a 30-day grace period to cancel.',
            )}
          </p>
          <button
            type="button"
            onClick={() => setShowDeleteDialog(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            {t('settings.deleteAccount', 'Delete Account')}
          </button>
        </div>
      )}

      <DeleteAccountDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onDeleted={() => {
          setShowDeleteDialog(false);
          // The user will be logged out by the backend (session invalidated)
          window.location.href = '/';
        }}
      />
    </main>
  );
}
