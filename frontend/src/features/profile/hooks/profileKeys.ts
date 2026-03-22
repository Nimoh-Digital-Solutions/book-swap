/**
 * profileKeys.ts
 *
 * TanStack Query key factory for the profile feature.
 * Centralises cache keys so invalidation is always consistent.
 */
export const profileKeys = {
  all: ['profile'] as const,
  me: () => [...profileKeys.all, 'me'] as const,
  details: () => [...profileKeys.all, 'detail'] as const,
  detail: (id: string) => [...profileKeys.details(), id] as const,
  checkUsername: (query: string) => [...profileKeys.all, 'check-username', query] as const,
};
