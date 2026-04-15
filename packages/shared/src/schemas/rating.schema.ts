import { z } from 'zod';

export const submitRatingSchema = z.object({
  score: z.number().int().min(1).max(5),
  comment: z.string().max(300).optional(),
});

export type SubmitRatingFormValues = z.infer<typeof submitRatingSchema>;
