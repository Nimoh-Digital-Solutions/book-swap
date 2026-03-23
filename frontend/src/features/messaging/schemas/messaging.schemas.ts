/**
 * messaging.schemas.ts
 *
 * Zod validation schemas for messaging-related forms.
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Send message
// ---------------------------------------------------------------------------

export const sendMessageSchema = z
  .object({
    content: z.string().max(1000).optional(),
    image: z.instanceof(File).optional(),
  })
  .refine((data) => !!data.content?.trim() || !!data.image, {
    message: 'A message must have either text content or an image.',
  });

export type SendMessageFormValues = z.infer<typeof sendMessageSchema>;
