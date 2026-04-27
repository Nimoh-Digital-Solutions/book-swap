/**
 * useDataExport.ts
 *
 * Mutation hook that asks the backend to email the user a copy of their
 * personal data. The backend builds the export off-thread and sends it as
 * a JSON attachment (AUD-B-704).
 */
import { useMutation } from '@tanstack/react-query';

import { dataExportService } from '../services/dataExportService';

export function useDataExport() {
  return useMutation({
    mutationFn: () => dataExportService.request(),
  });
}
