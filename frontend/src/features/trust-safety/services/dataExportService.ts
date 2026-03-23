/**
 * dataExport.service.ts
 *
 * API wrapper for the GDPR data export endpoint.
 */
import { API } from '@configs/apiEndpoints';
import { http } from '@services';

import type { DataExportResponse } from '../types/trustSafety.types';

export const dataExportService = {
  /** Download all personal data as JSON. */
  async download(): Promise<DataExportResponse> {
    const { data } = await http.get<DataExportResponse>(API.dataExport);
    return data;
  },
};
