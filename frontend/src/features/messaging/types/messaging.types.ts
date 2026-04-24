/**
 * messaging.types.ts
 *
 * Re-exports from `@shared` — see `packages/shared/src/types/messaging.ts`
 * for the canonical contracts (the BookSwap source of truth shared with the
 * mobile app).
 *
 * Web-local additions live below the re-export block:
 *   - SendMessagePayload: uses the browser `File` API (web-only concept).
 *   - MarkReadResponse: matches the shape returned by the
 *     `/messages/mark-read/` endpoint (web hits this; mobile doesn't).
 */

export type {
  ChatMessage,
  ChatWsMessage,
  ChatWsOutbound,
  MeetupCategory,
  MeetupLocation,
  MessageSender,
  PaginatedMessages,
  WsChatError,
  WsChatLocked,
  WsChatMessage,
  WsChatRead,
  WsChatTyping,
  WsSendMessage,
  WsSendRead,
  WsSendTyping,
} from '@shared/types/messaging';

// ---------------------------------------------------------------------------
// Web-only additions
// ---------------------------------------------------------------------------

/** Payload for sending a new message (text only — image via FormData). */
export interface SendMessagePayload {
  content?: string | undefined;
  image?: File | undefined;
}

/** Mark-read response. */
export interface MarkReadResponse {
  updated: number;
}
