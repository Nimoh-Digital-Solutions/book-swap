/**
 * reportSchema.ts
 *
 * Zod validation schema for the report form.
 */
import { z } from 'zod';

const REPORT_CATEGORIES = [
  'inappropriate',
  'fake_listing',
  'no_show',
  'misrepresented',
  'harassment',
  'spam',
  'other',
] as const;

export const reportSchema = z
  .object({
    reported_user_id: z.string().uuid(),
    reported_book_id: z.string().uuid().optional(),
    reported_exchange_id: z.string().uuid().optional(),
    category: z.enum(REPORT_CATEGORIES),
    description: z.string().max(500).optional().default(''),
  })
  .refine(
    (data) =>
      data.category !== 'other' || (data.description?.trim().length ?? 0) > 0,
    {
      message: 'Description is required when category is "Other".',
      path: ['description'],
    },
  );

export type ReportFormValues = z.infer<typeof reportSchema>;
