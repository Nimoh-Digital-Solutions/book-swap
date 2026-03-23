/**
 * exchangeKeys.ts
 *
 * TanStack Query key factory for the exchanges feature.
 * Centralises cache keys so invalidation is always consistent.
 */
export const exchangeKeys = {
  all: ['exchanges'] as const,
  lists: () => [...exchangeKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) =>
    [...exchangeKeys.lists(), filters ?? {}] as const,
  details: () => [...exchangeKeys.all, 'detail'] as const,
  detail: (id: string) => [...exchangeKeys.details(), id] as const,
  incoming: () => [...exchangeKeys.all, 'incoming'] as const,
  incomingList: (filters?: Record<string, unknown>) =>
    [...exchangeKeys.incoming(), 'list', filters ?? {}] as const,
  incomingCount: () => [...exchangeKeys.incoming(), 'count'] as const,
};
