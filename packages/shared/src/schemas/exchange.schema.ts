import { z } from 'zod';

import { swapTypeSchema } from './book.schema';

export const exchangeStatusSchema = z.enum([
  'pending', 'counter_proposed', 'accepted', 'conditions_pending', 'active',
  'swap_confirmed', 'completed', 'declined', 'cancelled', 'expired',
  'return_requested', 'returned',
]);

export const declineReasonSchema = z.enum([
  'not_interested', 'reserved', 'counter_proposed', 'other',
]);

const exchangeParticipantSchema = z.object({
  id: z.string(),
  username: z.string(),
  avatar: z.string().nullable(),
  avg_rating: z.number().nullable(),
  swap_count: z.number(),
});

const exchangeBookSchema = z.object({
  id: z.string(),
  title: z.string(),
  author: z.string(),
  cover_url: z.string(),
  condition: z.string(),
  primary_photo: z.string().nullable(),
});

export const exchangeListItemSchema = z.object({
  id: z.string(),
  status: exchangeStatusSchema,
  swap_type: swapTypeSchema,
  message: z.string(),
  requester: exchangeParticipantSchema,
  owner: exchangeParticipantSchema,
  requested_book: exchangeBookSchema,
  offered_book: exchangeBookSchema,
  created_at: z.string(),
  updated_at: z.string(),
});

export const exchangeDetailSchema = exchangeListItemSchema.extend({
  decline_reason: declineReasonSchema.nullable(),
  counter_to: z.string().nullable(),
  requester_confirmed_at: z.string().nullable(),
  owner_confirmed_at: z.string().nullable(),
  return_requested_at: z.string().nullable(),
  return_confirmed_requester: z.string().nullable(),
  return_confirmed_owner: z.string().nullable(),
  expired_at: z.string().nullable(),
  conditions_accepted_by_me: z.boolean(),
  conditions_accepted_count: z.number(),
  conditions_version: z.string(),
});

export const paginatedExchangesSchema = z.object({
  count: z.number(),
  next: z.string().nullable(),
  previous: z.string().nullable(),
  results: z.array(exchangeListItemSchema),
});

export type ExchangeListItemParsed = z.infer<typeof exchangeListItemSchema>;
export type ExchangeDetailParsed = z.infer<typeof exchangeDetailSchema>;
export type PaginatedExchangesParsed = z.infer<typeof paginatedExchangesSchema>;
