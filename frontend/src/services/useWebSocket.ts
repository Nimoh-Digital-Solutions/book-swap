import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuthStore } from '@features/auth/stores/authStore';
import { logger } from '@utils/logger';

import { createWebSocket } from './websocket';
import type {
  WebSocketHandle,
  WebSocketOptions,
  WsMessage,
} from './websocket.types';
import { WS_CLOSE_CODES } from './websocket.types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseWebSocketOptions {
  /** WebSocket URL (ws:// or wss://). Token is appended automatically. */
  url: string;
  /** Handler called for every parsed message. */
  onMessage?: (message: WsMessage) => void;
  /** Called when the connection opens. */
  onOpen?: () => void;
  /** Called when the connection closes. */
  onClose?: (event: CloseEvent) => void;
  /** Called on WebSocket errors. */
  onError?: (event: Event) => void;
  /** Enable auto-reconnect. Default `true`. */
  reconnect?: boolean;
  /** Maximum reconnection attempts. Default `5`. */
  maxRetries?: number;
  /** If `false`, the connection is not opened. Useful for conditional connections. */
  enabled?: boolean;
}

export interface UseWebSocketReturn {
  /** `true` when the socket is in the OPEN state. */
  isConnected: boolean;
  /** The most recent message received, or `null`. */
  lastMessage: WsMessage | null;
  /** Send a JSON payload to the server. No-op when disconnected. */
  send: (data: unknown) => void;
  /** Gracefully close the connection. */
  close: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useWebSocket — React hook that manages a WebSocket connection lifecycle.
 *
 * - Connects on mount (when `enabled` is true) and disconnects on unmount.
 * - Reads the JWT from the auth store; re-authenticates on 4001 close.
 * - Supports `AbortSignal`-style cancellation via the `enabled` flag.
 *
 * @example
 * ```tsx
 * function StoryStream({ storyId }: { storyId: number }) {
 *   const { isConnected, lastMessage } = useWebSocket({
 *     url: `wss://api.example.com/ws/stories/${storyId}/`,
 *     onMessage: (msg) => {
 *       if (msg.type === 'chunk') appendText(msg.chunk);
 *     },
 *   });
 *
 *   return <p>{isConnected ? 'Connected' : 'Connecting…'}</p>;
 * }
 * ```
 */
export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const {
    url,
    onMessage,
    onOpen,
    onClose,
    onError,
    reconnect = true,
    maxRetries = 5,
    enabled = true,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WsMessage | null>(null);

  // Refs to hold the latest callbacks so the WS factory doesn't capture stale closures
  const onMessageRef = useRef(onMessage);
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);
  const onErrorRef = useRef(onError);
  onMessageRef.current = onMessage;
  onOpenRef.current = onOpen;
  onCloseRef.current = onClose;
  onErrorRef.current = onError;

  const handleRef = useRef<WebSocketHandle | null>(null);

  // Stable send / close
  const send = useCallback((data: unknown) => {
    handleRef.current?.send(data);
  }, []);

  const close = useCallback(() => {
    handleRef.current?.close();
  }, []);

  useEffect(() => {
    if (!enabled || !url) return;

    // Read the current access token
    const token = useAuthStore.getState().accessToken;
    if (!token) {
      if (import.meta.env.DEV) {
        logger.warn('[useWebSocket] No access token — skipping connection');
      }
      return;
    }

    let disposed = false;

    const wsOptions: WebSocketOptions = {
      url,
      token,
      reconnect,
      maxRetries,
      onMessage(message) {
        if (disposed) return;
        setLastMessage(message);
        onMessageRef.current?.(message);
      },
      onOpen(_event) {
        if (disposed) return;
        setIsConnected(true);
        onOpenRef.current?.();
      },
      onClose(event) {
        if (disposed) return;
        setIsConnected(false);
        onCloseRef.current?.(event);

        // 4001 — attempt token refresh then reconnect once
        if (event.code === WS_CLOSE_CODES.NOT_AUTHENTICATED) {
          void useAuthStore
            .getState()
            .refreshToken()
            .then((success) => {
              if (success && !disposed) {
                const freshToken = useAuthStore.getState().accessToken;
                if (freshToken) {
                  // Reconnect with the refreshed token
                  handleRef.current = createWebSocket({
                    ...wsOptions,
                    token: freshToken,
                    reconnect: false, // Only one auto-recovery attempt
                  });
                }
              }
            });
        }
      },
      onError(event) {
        if (disposed) return;
        onErrorRef.current?.(event);
      },
    };

    handleRef.current = createWebSocket(wsOptions);

    return () => {
      disposed = true;
      handleRef.current?.close();
      handleRef.current = null;
      setIsConnected(false);
    };
    // Reconnect when URL changes — callers should memoise or keep url stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, enabled]);

  return { isConnected, lastMessage, send, close };
}
