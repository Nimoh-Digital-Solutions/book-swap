/**
 * notificationKeys.ts
 *
 * TanStack Query key factory for the notifications feature.
 * Centralises cache keys so invalidation is always consistent.
 */
export const notificationKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationKeys.all, 'list'] as const,
  preferences: () => [...notificationKeys.all, 'preferences'] as const,
};
