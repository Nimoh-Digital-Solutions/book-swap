/**
 * ratingKeys.ts
 *
 * TanStack Query key factory for the ratings feature.
 * Centralises cache keys so invalidation is always consistent.
 */
export const ratingKeys = {
  all: ['ratings'] as const,
  exchangeStatuses: () => [...ratingKeys.all, 'exchange-status'] as const,
  exchangeStatus: (exchangeId: string) =>
    [...ratingKeys.exchangeStatuses(), exchangeId] as const,
  userRatings: () => [...ratingKeys.all, 'user-ratings'] as const,
  userRating: (userId: string) =>
    [...ratingKeys.userRatings(), userId] as const,
};
