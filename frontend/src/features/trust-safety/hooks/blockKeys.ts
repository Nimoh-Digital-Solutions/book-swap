/**
 * blockKeys.ts
 *
 * TanStack Query key factory for the blocks feature.
 * Centralises cache keys so invalidation is always consistent.
 */
export const blockKeys = {
  all: ['blocks'] as const,
  lists: () => [...blockKeys.all, 'list'] as const,
  list: () => [...blockKeys.lists()] as const,
};
