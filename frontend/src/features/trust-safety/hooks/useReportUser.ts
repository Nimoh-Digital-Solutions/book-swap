/**
 * useReportUser.ts
 *
 * Mutation hook for creating a report.
 */
import { useMutation } from '@tanstack/react-query';

import { reportService } from '../services/reportService';
import type { CreateReportPayload } from '../types/trustSafety.types';

export function useReportUser() {
  return useMutation({
    mutationFn: (payload: CreateReportPayload) => reportService.create(payload),
  });
}
