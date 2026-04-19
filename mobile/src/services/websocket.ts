import { AppState, type AppStateStatus } from 'react-native';
import axios from 'axios';
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
  private maxReconnectAttempts = 10;
  private maxBackoffMs = 30_000;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private currentPath = '';
  private appStateSub: { remove: () => void } | null = null;
  private authenticated = false;

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
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      addBreadcrumb('websocket', 'Max reconnect attempts reached — giving up', {
        path: this.currentPath,
        attempts: this.reconnectAttempts,
      });
      this.handlers.get('__ws_exhausted__')?.forEach((h) => h({}));
      return;
    }
    this.clearReconnectTimer();
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, this.maxBackoffMs);
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      if (this.currentPath) {
        this.doConnect(this.currentPath);
      }
    }, delay);
  }

  connect(path: string) {
    this.reconnectAttempts = 0;
    this.clearReconnectTimer();
    this.currentPath = path;
    this.doConnect(path);
  }

  private doConnect(path: string) {
    const wsRoot = getWsBaseUrl();
    const url = `${wsRoot}${path.startsWith('/') ? path : `/${path}`}`;
    addBreadcrumb('websocket', 'connect', { path });

    this.authenticated = false;

    const oldWs = this.ws;
    if (oldWs) {
      oldWs.onopen = null;
      oldWs.onmessage = null;
      oldWs.onclose = null;
      oldWs.onerror = null;
      try { oldWs.close(); } catch { /* noop */ }
    }

    const ws = new WebSocket(url);
    this.ws = ws;

    ws.onopen = () => {
      if (this.ws !== ws) return;
      this.sendAuthMessage();
    };

    ws.onmessage = (event) => {
      if (this.ws !== ws) return;
      try {
        const data = JSON.parse(event.data) as { type?: string };
        const type = data.type as string;

        if (type === 'auth.success') {
          this.authenticated = true;
          this.reconnectAttempts = 0;
          this.handlers.get('__connected__')?.forEach((h) => h({}));
          return;
        }

        if (type === 'auth.failed' || type === 'auth.required') {
          addBreadcrumb('websocket', 'auth failed — attempting token refresh', { reason: (data as any).reason });
          this.attemptTokenRefreshAndReconnect();
          return;
        }

        this.handlers.get(type)?.forEach((h) => h(data));
        this.handlers.get('*')?.forEach((h) => h(data));
      } catch { /* ignore parse errors */ }
    };

    ws.onclose = () => {
      if (this.ws !== ws) return;
      this.authenticated = false;
      this.handlers.get('__disconnected__')?.forEach((h) => h({}));
      if (this.currentPath) this.scheduleReconnect();
    };

    ws.onerror = () => {
      if (this.ws !== ws) return;
      ws.close();
    };
  }

  private sendAuthMessage() {
    const token = tokenStorage.getAccess();
    if (token && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'authenticate', token }));
    }
  }

  private refreshingToken = false;

  private async attemptTokenRefreshAndReconnect() {
    if (this.refreshingToken) return;
    this.refreshingToken = true;
    try {
      const refresh = tokenStorage.getRefresh();
      if (!refresh) return;
      const { data } = await axios.post(`${env.apiUrl}/auth/token/refresh/`, { refresh }, {
        headers: { 'X-Client-Type': 'mobile' },
      });
      const newAccess = data.access as string;
      const newRefresh = (data.refresh as string) || refresh;
      tokenStorage.setTokens(newAccess, newRefresh);
      addBreadcrumb('websocket', 'token refreshed — reconnecting', {});
      this.reconnectWithNewToken();
    } catch {
      addBreadcrumb('websocket', 'token refresh failed — giving up', {});
    } finally {
      this.refreshingToken = false;
    }
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
    if (this.ws?.readyState === WebSocket.OPEN && this.authenticated) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect() {
    this.currentPath = '';
    this.authenticated = false;
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
