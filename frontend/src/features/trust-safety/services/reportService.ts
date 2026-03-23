/**
 * report.service.ts
 *
 * Thin API wrappers for report endpoints.
 * Consumed by TanStack Query hooks — never called directly from components.
 */
import { API } from '@configs/apiEndpoints';
import { http } from '@services';

import type { CreateReportPayload } from '../types/trustSafety.types';

export const reportService = {
  /** Create a new report. */
  async create(payload: CreateReportPayload): Promise<void> {
    await http.post(API.reports.create, payload);
  },
};
