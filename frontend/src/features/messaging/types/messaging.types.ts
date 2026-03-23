/**
 * messaging.types.ts
 *
 * Type contracts for the messaging feature, aligned with Django backend
 * serializers: MessageSerializer, MessageCreateSerializer,
 * MeetupLocationSerializer.
 */

// ---------------------------------------------------------------------------
// Nested shapes
// ---------------------------------------------------------------------------

/** Compact sender info embedded in message responses. */
export interface MessageSender {
  id: string;
  username: string;
  avatar: string | null;
}

// ---------------------------------------------------------------------------
// REST response shapes
// ---------------------------------------------------------------------------

/** A single chat message returned by the API. */
export interface ChatMessage {
  id: string;
  exchange: string;
  sender: MessageSender;
  content: string;
  image: string | null;
  read_at: string | null;
  created_at: string;
}

/** Paginated message list response. */
export interface PaginatedMessages {
  count: number;
  next: string | null;
  previous: string | null;
  results: ChatMessage[];
}

/** Payload for sending a new message (text only — image via FormData). */
export interface SendMessagePayload {
  content?: string | undefined;
  image?: File | undefined;
}

/** Mark-read response. */
export interface MarkReadResponse {
  updated: number;
}

/** Meetup category enum values. */
export type MeetupCategory = 'library' | 'cafe' | 'park' | 'station';

/** A curated meetup location. */
export interface MeetupLocation {
  id: string;
  name: string;
  address: string;
  category: MeetupCategory;
  city: string;
  latitude: number | null;
  longitude: number | null;
  distance_km: number | null;
}

// ---------------------------------------------------------------------------
// WebSocket message shapes (chat protocol)
// ---------------------------------------------------------------------------

/** Incoming: a new message was sent in the chat. */
export interface WsChatMessage {
  type: 'chat.message';
  message: ChatMessage;
}

/** Incoming: the partner is typing. */
export interface WsChatTyping {
  type: 'chat.typing';
  user_id: string;
  username: string;
}

/** Incoming: messages were marked as read by the partner. */
export interface WsChatRead {
  type: 'chat.read';
  user_id: string;
  read_at: string;
}

/** Incoming: chat is locked (exchange no longer writable). */
export interface WsChatLocked {
  type: 'chat.locked';
  message: string;
}

/** Incoming: server error in the chat consumer. */
export interface WsChatError {
  type: 'chat.error';
  message: string;
}

/** Discriminated union of all chat WebSocket messages. */
export type ChatWsMessage =
  | WsChatMessage
  | WsChatTyping
  | WsChatRead
  | WsChatLocked
  | WsChatError;

// ---------------------------------------------------------------------------
// Outbound WebSocket actions
// ---------------------------------------------------------------------------

export interface WsSendMessage {
  type: 'chat.message';
  content: string;
}

export interface WsSendTyping {
  type: 'chat.typing';
}

export interface WsSendRead {
  type: 'chat.read';
}

export type ChatWsOutbound = WsSendMessage | WsSendTyping | WsSendRead;
