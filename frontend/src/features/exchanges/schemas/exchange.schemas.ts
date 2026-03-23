/**
 * exchange.schemas.ts
 *
 * Zod validation schemas for exchange-related forms.
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Create exchange
// ---------------------------------------------------------------------------

export const createExchangeSchema = z.object({
  requested_book_id: z.string().uuid(),
  offered_book_id: z.string().uuid(),
  message: z.string().max(200).optional(),
});

export type CreateExchangeFormValues = z.infer<typeof createExchangeSchema>;

// ---------------------------------------------------------------------------
// Decline exchange
// ---------------------------------------------------------------------------

export const declineExchangeSchema = z.object({
  reason: z.enum(['not_interested', 'reserved', 'other']).optional(),
});

export type DeclineExchangeFormValues = z.infer<typeof declineExchangeSchema>;

// ---------------------------------------------------------------------------
// Counter-propose
// ---------------------------------------------------------------------------

export const counterProposeSchema = z.object({
  offered_book_id: z.string().uuid(),
});

export type CounterProposeFormValues = z.infer<typeof counterProposeSchema>;
