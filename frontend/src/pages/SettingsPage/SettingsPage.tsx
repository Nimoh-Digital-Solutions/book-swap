import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DeleteAccountDialog } from '@features/profile/components/DeleteAccountDialog';
import { useDocumentTitle } from '@hooks';
import { routeMetadata } from '@routes/config/paths';
import { PATHS } from '@routes/config/paths';
import { Trash2 } from 'lucide-react';

export default function SettingsPage(): ReactElement {
  const { t } = useTranslation();
  useDocumentTitle(routeMetadata[PATHS.SETTINGS].title);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold text-white">
        {t('settings.heading', 'Settings')}
      </h1>

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
