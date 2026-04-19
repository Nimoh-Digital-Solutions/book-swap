export type ExchangeStatus =
  | 'pending'
  | 'accepted'
  | 'conditions_pending'
  | 'active'
  | 'swap_confirmed'
  | 'completed'
  | 'declined'
  | 'cancelled'
  | 'expired'
  | 'return_requested'
  | 'returned';

export type DeclineReason = 'not_interested' | 'reserved' | 'counter_proposed' | 'other';

export interface ExchangeParticipant {
  id: string;
  username: string;
  avatar: string | null;
  avg_rating: number | null;
  swap_count: number;
}

export interface ExchangeBook {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  condition: string;
  primary_photo: string | null;
}

export interface ConditionsAcceptanceItem {
  id: string;
  user: string;
  accepted_at: string;
  conditions_version: string;
}

import type { SwapType } from './book';

export type { SwapType } from './book';

export interface ExchangeListItem {
  id: string;
  status: ExchangeStatus;
  swap_type: SwapType;
  message: string;
  requester: ExchangeParticipant;
  owner: ExchangeParticipant;
  requested_book: ExchangeBook;
  offered_book: ExchangeBook;
  created_at: string;
  updated_at: string;
  unread_count: number;
  last_message_at: string | null;
  last_message_preview: string;
}

export interface ExchangeDetail extends ExchangeListItem {
  decline_reason: DeclineReason | null;
  counter_to: string | null;
  original_offered_book: ExchangeBook | null;
  last_counter_by: string | null;
  counter_approved_at: string | null;
  requester_confirmed_at: string | null;
  owner_confirmed_at: string | null;
  return_requested_at: string | null;
  return_confirmed_requester: string | null;
  return_confirmed_owner: string | null;
  expired_at: string | null;
  conditions_accepted_by_me: boolean;
  conditions_accepted_count: number;
  conditions_version: string;
}

export interface PaginatedExchanges {
  count: number;
  next: string | null;
  previous: string | null;
  results: ExchangeListItem[];
}

export interface ConditionsStatus {
  conditions_version: string;
  acceptances: ConditionsAcceptanceItem[];
  both_accepted: boolean;
}

export interface IncomingCount {
  count: number;
}

export interface CreateExchangePayload {
  requested_book_id: string;
  offered_book_id: string;
  message?: string;
}

export interface CounterProposePayload {
  offered_book_id: string;
}

export interface DeclinePayload {
  reason?: DeclineReason;
}
