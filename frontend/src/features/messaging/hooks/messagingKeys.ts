/**
 * messagingKeys.ts
 *
 * TanStack Query key factory for the messaging feature.
 * Centralises cache keys so invalidation is always consistent.
 */
export const messagingKeys = {
  all: ['messaging'] as const,
  messages: () => [...messagingKeys.all, 'messages'] as const,
  messageList: (exchangeId: string) =>
    [...messagingKeys.messages(), exchangeId] as const,
  meetupSuggestions: () => [...messagingKeys.all, 'meetup-suggestions'] as const,
  meetupSuggestion: (exchangeId: string) =>
    [...messagingKeys.meetupSuggestions(), exchangeId] as const,
};
