import type { ReportCategory, ReportStatus } from '../types/trust-safety';

export const REPORT_CATEGORIES = [
  'inappropriate', 'fake_listing', 'no_show', 'misrepresented',
  'harassment', 'spam', 'other',
] as const satisfies readonly ReportCategory[];

export const REPORT_STATUSES = [
  'open', 'reviewed', 'resolved', 'dismissed',
] as const satisfies readonly ReportStatus[];
