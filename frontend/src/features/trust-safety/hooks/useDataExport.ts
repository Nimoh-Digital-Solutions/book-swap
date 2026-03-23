/**
 * useDataExport.ts
 *
 * Mutation hook for downloading personal data export.
 */
import { useMutation } from '@tanstack/react-query';

import { dataExportService } from '../services/dataExportService';

export function useDataExport() {
  return useMutation({
    mutationFn: () => dataExportService.download(),
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bookswap-data-export.json';
      a.click();
      URL.revokeObjectURL(url);
    },
  });
}
