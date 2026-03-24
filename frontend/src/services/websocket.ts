import { addBreadcrumb } from '@configs/sentry';
import { logger } from '@utils/logger';

import type {
  WebSocketHandle,
  WebSocketOptions,
  WsCloseCode,
  WsMessage,
} from './websocket.types';
import { WS_CLOSE_CODES } from './websocket.types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default maximum reconnection attempts. */
const DEFAULT_MAX_RETRIES = 5;

/** Default base delay (ms) for exponential backoff. */
const DEFAULT_BASE_DELAY = 1_000;

/** Close codes that should NOT trigger auto-reconnect. */
const NON_RETRYABLE_CODES = new Set<number>([
  1000, // Normal closure
  WS_CLOSE_CODES.FORBIDDEN,
  WS_CLOSE_CODES.NOT_FOUND,
]);

// ---------------------------------------------------------------------------
// Message parsing
// ---------------------------------------------------------------------------

/**
 * Safely parse a WebSocket `MessageEvent.data` string into a typed message.
 * Returns `null` when the payload is not valid JSON or doesn't have a `type`
 * discriminator.
 */
function parseMessage(raw: unknown): WsMessage | null {
  if (typeof raw !== 'string') return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'type' in parsed &&
      typeof (parsed as Record<string, unknown>)['type'] === 'string'
    ) {
      return parsed as WsMessage;
    }
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * createWebSocket — low-level factory for managed WebSocket connections.
 *
 * Features:
 * - Appends JWT as `?token=` query parameter for Django Channels auth
 * - Parses incoming JSON into typed `WsMessage` discriminated union
 * - Exponential backoff auto-reconnect (configurable, skipped for 4003/4004)
 * - Sentry breadcrumbs for open/close/error events
 * - Idempotent `close()` that disables reconnect
 *
 * @example
 * ```ts
 * const ws = createWebSocket({
 *   url: 'wss://api.example.com/ws/stories/42/',
 *   token: accessToken,
 *   onMessage: (msg) => { if (msg.type === 'chunk') appendText(msg.chunk); },
 *   onClose: (e) => { if (e.code === 4001) refreshAndReconnect(); },
 * });
 *
 * ws.send({ action: 'start' });
 * ws.close();
 * ```
 */
export function createWebSocket(options: WebSocketOptions): WebSocketHandle {
  const {
    url,
    token,
    onMessage,
    onError,
    onClose,
    onOpen,
    reconnect = true,
    maxRetries = DEFAULT_MAX_RETRIES,
    baseDelay = DEFAULT_BASE_DELAY,
  } = options;

  let socket: WebSocket | null = null;
  let retryCount = 0;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let intentionalClose = false;

  // -- Helpers --------------------------------------------------------------

  /** Build the full URL with the JWT query param. */
  function buildUrl(): string {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}token=${encodeURIComponent(token)}`;
  }

  /** Calculate exponential backoff delay with jitter. */
  function backoffDelay(): number {
    const exponential = baseDelay * 2 ** retryCount;
    // Add ±25 % jitter to avoid thundering-herd on reconnect
    const jitter = exponential * 0.25 * (Math.random() * 2 - 1);
    return Math.min(exponential + jitter, 30_000); // cap at 30 s
  }

  function scheduleReconnect(): void {
    if (!reconnect || intentionalClose || retryCount >= maxRetries) return;

    const delay = backoffDelay();
    retryCount += 1;

    if (import.meta.env.DEV) {
      logger.debug(
        `[ws] Reconnecting in ${Math.round(delay)} ms (attempt ${retryCount}/${maxRetries})`,
      );
    }

    retryTimer = setTimeout(() => {
      connect();
    }, delay);
  }

  // -- Connection lifecycle -------------------------------------------------

  function connect(): void {
    // Clean up any previous socket
    if (socket) {
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;
    }

    socket = new WebSocket(buildUrl());

    socket.onopen = (event) => {
      retryCount = 0; // Reset on successful connection
      addBreadcrumb('WebSocket connected', 'websocket', { url });
      onOpen?.(event);
    };

    socket.onmessage = (event: MessageEvent) => {
      const message = parseMessage(event.data);
      if (message) {
        onMessage(message);
      } else if (import.meta.env.DEV) {
        logger.warn('[ws] Unparseable message', { data: event.data });
      }
    };

    socket.onerror = (event) => {
      addBreadcrumb('WebSocket error', 'websocket', { url });
      onError?.(event);
    };

    socket.onclose = (event) => {
      addBreadcrumb('WebSocket closed', 'websocket', {
        url,
        code: event.code,
        reason: event.reason,
      });
      onClose?.(event);

      // Decide whether to reconnect
      if (!intentionalClose && !NON_RETRYABLE_CODES.has(event.code)) {
        scheduleReconnect();
      }
    };
  }

  // -- Public API -----------------------------------------------------------

  connect();

  return {
    send(data: unknown): void {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(data));
      } else if (import.meta.env.DEV) {
        logger.warn('[ws] Cannot send — socket is not open');
      }
    },

    close(code = 1000, reason = 'Client closed'): void {
      intentionalClose = true;

      if (retryTimer !== null) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }

      if (!socket) return;

      if (socket.readyState === WebSocket.CONNECTING) {
        // Calling close() while CONNECTING triggers the browser warning
        // "WebSocket is closed before the connection is established".
        // Instead, null out all handlers and let the socket self-close
        // once it finishes opening (happens during React Strict Mode teardown).
        const s = socket;
        s.onopen = () => s.close(code, reason);
        s.onmessage = null;
        s.onerror = null;
        s.onclose = null;
      } else if (
        socket.readyState !== WebSocket.CLOSED &&
        socket.readyState !== WebSocket.CLOSING
      ) {
        socket.close(code, reason);
      }
    },

    readyState(): number {
      return socket?.readyState ?? WebSocket.CLOSED;
    },
  };
}

export { WS_CLOSE_CODES };
export type { WebSocketHandle,WebSocketOptions, WsCloseCode, WsMessage };
