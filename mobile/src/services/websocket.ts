import { AppState, type AppStateStatus } from 'react-native';
import { tokenStorage } from '@/lib/storage';
import { addBreadcrumb } from '@/lib/sentry';
import { env } from '@/configs/env';

function getWsBaseUrl(): string {
  return env.wsUrl;
}

type MessageHandler = (data: unknown) => void;

class WebSocketManager {
  private ws: WebSocket | null = null;
  private handlers = new Map<string, Set<MessageHandler>>();
  private reconnectAttempts = 0;
  private maxBackoffMs = 30_000;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private currentPath = '';
  private appStateSub: { remove: () => void } | null = null;

  constructor() {
    const onAppState = (next: AppStateStatus) => {
      if (next === 'active' && this.currentPath) {
        addBreadcrumb('websocket', 'App foreground — reconnect', { path: this.currentPath });
        this.reconnectWithNewToken();
      }
    };
    this.appStateSub = AppState.addEventListener('change', onAppState);
  }

  private clearReconnectTimer() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private scheduleReconnect() {
    this.clearReconnectTimer();
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, this.maxBackoffMs);
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      if (this.currentPath) {
        this.connect(this.currentPath);
      }
    }, delay);
  }

  connect(path: string) {
    this.reconnectAttempts = 0;
    this.clearReconnectTimer();
    this.currentPath = path;
    const token = tokenStorage.getAccess();
    const wsRoot = getWsBaseUrl();
    const url = `${wsRoot}${path.startsWith('/') ? path : `/${path}`}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    addBreadcrumb('websocket', 'connect', { path });

    try {
      this.ws?.close();
    } catch {
      /* noop */
    }

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      const access = tokenStorage.getAccess();
      if (access) {
        try {
          this.ws?.send(JSON.stringify({ type: 'auth', token: access }));
        } catch {
          /* closed */
        }
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as { type?: string };
        const type = data.type as string;
        this.handlers.get(type)?.forEach((h) => h(data));
        this.handlers.get('*')?.forEach((h) => h(data));
      } catch {
        /* ignore parse errors */
      }
    };

    this.ws.onclose = () => {
      if (this.currentPath) this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  reconnectWithNewToken() {
    if (!this.currentPath) return;
    addBreadcrumb('websocket', 'reconnectWithNewToken', {});
    this.reconnectAttempts = 0;
    this.connect(this.currentPath);
  }

  on(type: string, handler: MessageHandler) {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type)!.add(handler);
    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  send(data: Record<string, unknown>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect() {
    this.currentPath = '';
    this.clearReconnectTimer();
    try {
      this.ws?.close();
    } catch {
      /* noop */
    }
    this.ws = null;
  }

  destroy() {
    this.disconnect();
    this.appStateSub?.remove();
    this.appStateSub = null;
  }
}

export const wsManager = new WebSocketManager();
