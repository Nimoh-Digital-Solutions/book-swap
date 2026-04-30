import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { wsManager } from '@/services/websocket';
import { useAuthStore } from '@/stores/authStore';
import { resolveMediaUrl } from '@/lib/resolveMediaUrl';
import type { Message } from '@/types';

const TYPING_TIMEOUT_MS = 3_000;
const TYPING_COOLDOWN_MS = 500;
const RECONNECT_DELAY_MS = 300;

interface Options {
  exchangeId: string;
  enabled?: boolean;
}

interface WsMessagePayload {
  id: string;
  exchange: string;
  sender: { id: string; username: string; avatar: string | null };
  content: string;
  image: string | null;
  read_at: string | null;
  created_at: string;
}

function wsPayloadToMessage(p: WsMessagePayload): Message {
  return {
    id: p.id,
    exchange: p.exchange,
    sender: p.sender as Message['sender'],
    content: p.content,
    image: resolveMediaUrl(p.image),
    read_at: p.read_at,
    created_at: p.created_at,
  };
}

export function useChatWebSocket({ exchangeId, enabled = true }: Options) {
  const qc = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [isConnected, setIsConnected] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || !exchangeId) return;

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    const wsPath = `/ws/chat/${exchangeId}/`;
    wsManager.connect(wsPath);

    const unsubs: (() => void)[] = [];

    unsubs.push(
      wsManager.on('__connected__', () => {
        setIsConnected(true);
        // Always refetch on every (re)connect. Any chat.message or
        // chat.read_all event broadcast while the WS was mid-reconnect is
        // lost forever (channel layer does not replay), so we self-heal by
        // pulling the latest server state. TanStack dedupes if a fetch is
        // already in flight, so the cost is negligible.
        qc.invalidateQueries({ queryKey: ['messages', exchangeId] });
      }),
    );
    unsubs.push(
      wsManager.on('__disconnected__', () => setIsConnected(false)),
    );

    unsubs.push(
      wsManager.on('chat.message', (data: unknown) => {
        const payload = data as WsMessagePayload;
        if (!payload.id) return;

        const newMsg = wsPayloadToMessage(payload);

        qc.setQueryData<Message[]>(['messages', exchangeId], (old) => {
          if (!old) return [newMsg];
          if (old.some((m) => m.id === newMsg.id)) return old;
          return [...old, newMsg];
        });
      }),
    );

    unsubs.push(
      wsManager.on('chat.typing', (data: unknown) => {
        const d = data as { user_id?: string; display_name?: string };
        if (d.user_id === currentUserId) return;
        setTypingUser(d.display_name ?? null);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setTypingUser(null), TYPING_TIMEOUT_MS);
      }),
    );

    unsubs.push(
      wsManager.on('chat.read', () => {
        qc.invalidateQueries({ queryKey: ['messages', exchangeId] });
      }),
    );

    unsubs.push(
      wsManager.on('chat.read_all', (data: unknown) => {
        const { read_at } = data as { read_at: string };
        qc.setQueryData<Message[]>(['messages', exchangeId], (old) => {
          if (!old) return old;
          let changed = false;
          const updated = old.map((m) => {
            if (m.sender.id === currentUserId && !m.read_at) {
              changed = true;
              return { ...m, read_at };
            }
            return m;
          });
          return changed ? updated : old;
        });
      }),
    );

    unsubs.push(
      wsManager.on('chat.locked', () => {
        setIsLocked(true);
      }),
    );

    return () => {
      unsubs.forEach((u) => u());
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      wsManager.disconnect();

      reconnectTimerRef.current = setTimeout(() => {
        if (useAuthStore.getState().isAuthenticated) {
          wsManager.connect('/ws/notifications/');
        }
      }, RECONNECT_DELAY_MS);
    };
  }, [exchangeId, enabled, currentUserId, qc]);

  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, []);

  const sendTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingSentRef.current > TYPING_COOLDOWN_MS) {
      wsManager.send({ type: 'chat.typing' });
      lastTypingSentRef.current = now;
    }
  }, []);

  return {
    isConnected,
    isLocked,
    typingUser,
    sendTyping,
  };
}
