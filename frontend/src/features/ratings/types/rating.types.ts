/**
 * rating.types.ts
 *
 * Type contracts for the ratings feature, aligned with Django backend
 * serializers: RatingSerializer, RatingCreateSerializer,
 * ExchangeRatingStatusSerializer.
 */

// ---------------------------------------------------------------------------
// Nested shapes
// ---------------------------------------------------------------------------

/** Compact user info embedded in rating responses. */
export interface RatingUser {
  id: string;
  username: string;
  avatar: string | null;
}

// ---------------------------------------------------------------------------
// Response shapes (from BE)
// ---------------------------------------------------------------------------

/** A single rating returned by the API. */
export interface Rating {
  id: string;
  exchange: string;
  rater: RatingUser;
  rated: RatingUser;
  score: number;
  comment: string;
  created_at: string;
}

/** Rating status for an exchange from the current user's perspective. */
export interface ExchangeRatingStatus {
  exchange_id: string;
  my_rating: Rating | null;
  partner_rating: Rating | null;
  can_rate: boolean;
  rating_deadline: string;
}

/** Paginated rating list response. */
export interface PaginatedRatings {
  count: number;
  next: string | null;
  previous: string | null;
  results: Rating[];
}

// ---------------------------------------------------------------------------
// Request shapes (to BE)
// ---------------------------------------------------------------------------

/** Payload for submitting a rating. */
export interface SubmitRatingPayload {
  score: number;
  comment?: string | undefined;
}
