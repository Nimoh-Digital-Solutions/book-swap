/**
 * dataExport.service.ts
 *
 * API wrapper for the GDPR data export endpoint.
 *
 * AUD-B-704: the backend now builds the export off the request thread and
 * emails it as a JSON attachment. The endpoint returns 202 with a "queued"
 * payload; we no longer download a JSON blob in the browser.
 */
import { API } from '@configs/apiEndpoints';
import { http } from '@services';

export interface DataExportQueuedResponse {
  queued: boolean;
  detail: string;
}

export const dataExportService = {
  /** Ask the backend to email a JSON copy of all personal data. */
  async request(): Promise<DataExportQueuedResponse> {
    const { data } = await http.post<DataExportQueuedResponse>(API.dataExport);
    return data;
  },
};
