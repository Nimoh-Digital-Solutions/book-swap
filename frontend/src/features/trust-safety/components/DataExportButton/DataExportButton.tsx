import { type ReactElement,useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppStore } from '@data/useAppStore';
import { Download } from 'lucide-react';

import { useDataExport } from '../../hooks/useDataExport';

export function DataExportButton(): ReactElement {
  const { t } = useTranslation('trust-safety');
  const addNotification = useAppStore((s) => s.addNotification);
  const exportMutation = useDataExport();

  const handleExport = useCallback(() => {
    exportMutation.mutate(undefined, {
      onSuccess: () => {
        addNotification(t('dataExport.success'), { variant: 'success' });
      },
      onError: () => {
        addNotification(t('dataExport.error'), { variant: 'error' });
      },
    });
  }, [exportMutation, addNotification, t]);

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={exportMutation.isPending}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-[#28382D] text-white rounded-lg hover:bg-[#354A3D] transition-colors disabled:opacity-50"
    >
      <Download className="w-4 h-4" aria-hidden="true" />
      {exportMutation.isPending
        ? t('dataExport.loading')
        : t('dataExport.button')}
    </button>
  );
}
