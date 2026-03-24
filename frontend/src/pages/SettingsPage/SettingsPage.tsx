import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { NotificationPreferencesSection } from '@features/notifications';
import { DeleteAccountDialog } from '@features/profile/components/DeleteAccountDialog';
import { PasswordChangeSection } from '@features/profile/components/PasswordChangeSection/PasswordChangeSection';
import { PrivacySection } from '@features/profile/components/PrivacySection/PrivacySection';
import { useProfile } from '@features/profile/hooks/useProfile';
import {
  BlockedUsersList,
  DataExportButton,
} from '@features/trust-safety';
import { useDocumentTitle } from '@hooks';
import { routeMetadata } from '@routes/config/paths';
import { PATHS } from '@routes/config/paths';
import { Shield, Trash2 } from 'lucide-react';

export default function SettingsPage(): ReactElement {
  const { t } = useTranslation();
  useDocumentTitle(routeMetadata[PATHS.SETTINGS].title);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { data: profile } = useProfile();

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

      {/* Danger zone */}
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
