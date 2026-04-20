import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { documentDirectory, writeAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useTranslation } from 'react-i18next';

import { http } from '@/services/http';
import { API } from '@/configs/apiEndpoints';
import { showSuccessToast, showErrorToast } from '@/components/Toast';

const FILENAME = 'bookswap-data-export.json';

export function useDataExport() {
  const { t } = useTranslation();
  const [isPending, setIsPending] = useState(false);

  const exportData = useCallback(async () => {
    setIsPending(true);
    try {
      const { data } = await http.get(API.users.meDataExport);
      const json = JSON.stringify(data, null, 2);
      const fileUri = documentDirectory + FILENAME;

      await writeAsStringAsync(fileUri, json, {
        encoding: EncodingType.UTF8,
      });

      const sharingAvailable = await Sharing.isAvailableAsync();
      if (sharingAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: t('dataExport.shareTitle'),
          UTI: 'public.json',
        });
      } else {
        showSuccessToast(t('dataExport.savedLocally'));
      }
    } catch {
      showErrorToast(t('dataExport.error'));
    } finally {
      setIsPending(false);
    }
  }, [t]);

  return { exportData, isPending };
}
