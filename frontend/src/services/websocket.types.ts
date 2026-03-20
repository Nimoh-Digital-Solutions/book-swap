// ---------------------------------------------------------------------------
// WebSocket message types for story generation streaming
// ---------------------------------------------------------------------------

/**
 * A partial chunk of generated story text.
 * Sent repeatedly as the LLM produces tokens.
 */
export interface WsChunkMessage {
  type: 'chunk';
  /** The text fragment to append to the running story buffer. */
  chunk: string;
}

/**
 * Signals that story generation finished successfully.
 * The client should invalidate the TanStack Query cache for the story.
 */
export interface WsCompleteMessage {
  type: 'complete';
  story_id: number;
  title: string;
  word_count: number;
  /** Whether the user's library storage limit has been reached. */
  library_full: boolean;
  /** Optional message from the BE when the library is full or near capacity. */
  library_message: string | null;
}

/**
 * Signals a server-side error during generation.
 */
export interface WsErrorMessage {
  type: 'error';
  message: string;
}

/**
 * Discriminated union of all WebSocket message shapes the server may send.
 *
 * Add new message types here as the protocol evolves.
 */
export type WsMessage = WsChunkMessage | WsCompleteMessage | WsErrorMessage;

// ---------------------------------------------------------------------------
// WebSocket configuration types
// ---------------------------------------------------------------------------

/**
 * Application-specific close codes returned by the Django Channels backend.
 *
 * Standard close codes (1000, 1001, etc.) are defined by RFC 6455.
 * Application codes occupy the 4000–4999 range.
 */
export const WS_CLOSE_CODES = {
  /** The JWT was missing, expired, or invalid. */
  NOT_AUTHENTICATED: 4001,
  /** The user lacks permission for the requested resource. */
  FORBIDDEN: 4003,
  /** The requested resource (e.g. story) does not exist. */
  NOT_FOUND: 4004,
} as const;

export type WsCloseCode = (typeof WS_CLOSE_CODES)[keyof typeof WS_CLOSE_CODES];

/**
 * Options for creating a WebSocket connection via `createWebSocket()`.
 */
export interface WebSocketOptions {
  /** Full WebSocket URL (ws:// or wss://). */
  url: string;
  /** JWT access token appended as `?token=<jwt>` query parameter. */
  token: string;
  /** Handler invoked for every parsed message from the server. */
  onMessage: (data: WsMessage) => void;
  /** Handler for WebSocket error events. */
  onError?: (event: Event) => void;
  /** Handler for WebSocket close events. */
  onClose?: (event: CloseEvent) => void;
  /** Handler invoked when the connection is (re-)established. */
  onOpen?: (event: Event) => void;
  /** Enable auto-reconnect on transient failures. Default `true`. */
  reconnect?: boolean;
  /** Maximum reconnection attempts before giving up. Default `5`. */
  maxRetries?: number;
  /** Base delay in ms for exponential backoff. Default `1000`. */
  baseDelay?: number;
}

/**
 * Handle returned by `createWebSocket()` — allows sending messages
 * and controlling the connection lifecycle.
 */
export interface WebSocketHandle {
  /** Send a JSON-serialisable payload to the server. */
  send: (data: unknown) => void;
  /** Gracefully close the connection. Disables auto-reconnect. */
  close: (code?: number, reason?: string) => void;
  /** Current connection state. */
  readyState: () => number;
}
