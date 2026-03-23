/**
 * exchange.types.ts
 *
 * Type contracts for the exchanges feature, aligned with the Django backend
 * serializers: ExchangeRequestListSerializer, ExchangeRequestDetailSerializer,
 * ExchangeRequestCreateSerializer, CounterProposeSerializer, DeclineSerializer,
 * and ConditionsAcceptanceSerializer.
 */

// ---------------------------------------------------------------------------
// Enums / value types
// ---------------------------------------------------------------------------

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

export type DeclineReason = 'not_interested' | 'reserved' | 'other';

// ---------------------------------------------------------------------------
// Nested shapes
// ---------------------------------------------------------------------------

/** Compact user info nested in exchange responses. */
export interface ExchangeParticipant {
  id: string;
  username: string;
  avatar: string | null;
  avg_rating: number | null;
  swap_count: number;
}

/** Compact book info nested in exchange responses. */
export interface ExchangeBook {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  condition: string;
  primary_photo: string | null;
}

/** Conditions acceptance record. */
export interface ConditionsAcceptanceItem {
  id: string;
  user: string;
  accepted_at: string;
  conditions_version: string;
}

// ---------------------------------------------------------------------------
// Response shapes (from BE)
// ---------------------------------------------------------------------------

/** Compact exchange data — returned by `GET /api/v1/exchanges/` list. */
export interface ExchangeListItem {
  id: string;
  status: ExchangeStatus;
  message: string;
  requester: ExchangeParticipant;
  owner: ExchangeParticipant;
  requested_book: ExchangeBook;
  offered_book: ExchangeBook;
  created_at: string;
  updated_at: string;
}

/** Full exchange detail — returned by `GET /api/v1/exchanges/:id/`. */
export interface ExchangeDetail extends ExchangeListItem {
  decline_reason: DeclineReason | null;
  counter_to: string | null;
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

/** Paginated response shape for exchange lists. */
export interface PaginatedExchanges {
  count: number;
  next: string | null;
  previous: string | null;
  results: ExchangeListItem[];
}

/** Conditions endpoint response. */
export interface ConditionsStatus {
  conditions_version: string;
  acceptances: ConditionsAcceptanceItem[];
  both_accepted: boolean;
}

/** Incoming count response. */
export interface IncomingCount {
  count: number;
}

// ---------------------------------------------------------------------------
// Mutation payloads
// ---------------------------------------------------------------------------

export interface CreateExchangePayload {
  requested_book_id: string;
  offered_book_id: string;
  message?: string | undefined;
}

export interface CounterProposePayload {
  offered_book_id: string;
}

export interface DeclinePayload {
  reason?: DeclineReason | undefined;
}
