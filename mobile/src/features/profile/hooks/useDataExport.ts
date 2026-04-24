/**
 * useDataExport
 *
 * AUD-B-704: the backend now builds the GDPR JSON export off-thread and
 * emails it to the user as an attachment. The mobile client just POSTs to
 * the endpoint and shows a toast confirming the email is on its way — no
 * more in-app file I/O for what could be a multi-megabyte JSON.
 */
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { http } from '@/services/http';
import { API } from '@/configs/apiEndpoints';
import { showSuccessToast, showErrorToast } from '@/components/Toast';

export function useDataExport() {
  const { t } = useTranslation();
  const [isPending, setIsPending] = useState(false);

  const exportData = useCallback(async () => {
    setIsPending(true);
    try {
      await http.post(API.users.meDataExport);
      showSuccessToast(t('dataExport.success'));
    } catch {
      showErrorToast(t('dataExport.error'));
    } finally {
      setIsPending(false);
    }
  }, [t]);

  return { exportData, isPending };
}
