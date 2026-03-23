/**
 * Ratings feature public API
 *
 * Import from '@features/ratings' in consuming code — never reach
 * into sub-directories directly from outside this feature.
 *
 * @example
 * import { useExchangeRatingStatus, useSubmitRating, ratingService } from '@features/ratings';
 */

// Hooks
export { ratingKeys } from './hooks/ratingKeys';
export { useExchangeRatingStatus } from './hooks/useExchangeRatingStatus';
export { useSubmitRating } from './hooks/useSubmitRating';
export { useUserRatings } from './hooks/useUserRatings';

// Schemas
export type { SubmitRatingFormValues } from './schemas/rating.schemas';
export { submitRatingSchema } from './schemas/rating.schemas';

// Services
export { ratingService } from './services/rating.service';

// Types
export type {
  ExchangeRatingStatus,
  PaginatedRatings,
  Rating,
  RatingUser,
  SubmitRatingPayload,
} from './types/rating.types';
