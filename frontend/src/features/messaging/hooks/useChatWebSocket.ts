/**
 * useChatWebSocket.ts
 *
 * React hook that manages the WebSocket connection for a specific exchange chat.
 *
 * - Connects to `ws/chat/{exchangeId}/` on mount
 * - Dispatches incoming messages to TanStack Query cache updates
 * - Exposes helpers for sending messages, typing indicators, and read receipts
 */
import { useCallback, useRef, useState } from 'react';

import { APP_CONFIG } from '@configs/appConfig';
import type { WsMessage } from '@services';
import { useWebSocket } from '@services';
import { useQueryClient } from '@tanstack/react-query';

import type {
  ChatMessage,
  ChatWsMessage,
  PaginatedMessages,
} from '../types/messaging.types';
import { messagingKeys } from './messagingKeys';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseChatWebSocketOptions {
  exchangeId: string;
  enabled?: boolean;
  /** Called when a new message arrives via WebSocket. */
  onNewMessage?: (message: ChatMessage) => void;
  /** Called when the partner starts typing. */
  onTyping?: (userId: string, username: string) => void;
  /** Called when the chat is locked (exchange no longer writable). */
  onLocked?: (reason: string) => void;
}

export interface UseChatWebSocketReturn {
  isConnected: boolean;
  isLocked: boolean;
  /** Send a text message via WebSocket. */
  sendMessage: (content: string) => void;
  /** Notify the partner that the user is typing. */
  sendTyping: () => void;
  /** Notify the partner that messages have been read. */
  sendRead: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isChatMessage(msg: unknown): msg is ChatWsMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    typeof (msg as Record<string, unknown>)['type'] === 'string' &&
    ((msg as Record<string, unknown>)['type'] as string).startsWith('chat.')
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useChatWebSocket(
  options: UseChatWebSocketOptions,
): UseChatWebSocketReturn {
  const {
    exchangeId,
    enabled = true,
    onNewMessage,
    onTyping,
    onLocked,
  } = options;

  const qc = useQueryClient();
  const [isLocked, setIsLocked] = useState(false);

  // Keep latest callbacks in refs to avoid re-connecting on every render
  const onNewMessageRef = useRef(onNewMessage);
  const onTypingRef = useRef(onTyping);
  const onLockedRef = useRef(onLocked);
  onNewMessageRef.current = onNewMessage;
  onTypingRef.current = onTyping;
  onLockedRef.current = onLocked;

  const wsUrl = `${APP_CONFIG.wsUrl}/ws/chat/${exchangeId}/`;

  const handleMessage = useCallback(
    (msg: WsMessage) => {
      if (!isChatMessage(msg)) return;
      const chatMsg = msg as ChatWsMessage;

      switch (chatMsg.type) {
        case 'chat.message': {
          // Append to the infinite query cache
          qc.setQueryData<{ pages: PaginatedMessages[]; pageParams: unknown[] }>(
            messagingKeys.messageList(exchangeId),
            (old) => {
              if (!old) return old;
              const lastPage = old.pages[old.pages.length - 1];
              if (!lastPage) return old;
              return {
                ...old,
                pages: [
                  ...old.pages.slice(0, -1),
                  {
                    ...lastPage,
                    count: lastPage.count + 1,
                    results: [...lastPage.results, chatMsg.message],
                  },
                ],
              };
            },
          );
          onNewMessageRef.current?.(chatMsg.message);
          break;
        }
        case 'chat.typing': {
          onTypingRef.current?.(chatMsg.user_id, chatMsg.username);
          break;
        }
        case 'chat.read': {
          // Invalidate to refetch with updated read_at timestamps
          void qc.invalidateQueries({
            queryKey: messagingKeys.messageList(exchangeId),
          });
          break;
        }
        case 'chat.locked': {
          setIsLocked(true);
          onLockedRef.current?.(chatMsg.message);
          break;
        }
        case 'chat.error': {
          // Could be surfaced to UI via toast — for now just log
          break;
        }
      }
    },
    [exchangeId, qc],
  );

  const { isConnected, send } = useWebSocket({
    url: wsUrl,
    onMessage: handleMessage,
    enabled: enabled && !!exchangeId,
    reconnect: true,
  });

  const sendMessage = useCallback(
    (content: string) => {
      send({ type: 'chat.message', content });
    },
    [send],
  );

  const sendTyping = useCallback(() => {
    send({ type: 'chat.typing' });
  }, [send]);

  const sendRead = useCallback(() => {
    send({ type: 'chat.read' });
  }, [send]);

  return {
    isConnected,
    isLocked,
    sendMessage,
    sendTyping,
    sendRead,
  };
}
