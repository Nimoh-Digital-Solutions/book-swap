jest.mock('@/lib/storage', () => ({
  tokenStorage: {
    getAccess: jest.fn(() => 'access-token'),
    getRefresh: jest.fn(() => 'refresh-token'),
    setTokens: jest.fn(),
  },
}));
jest.mock('@/lib/sentry', () => ({
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
}));
jest.mock('@/configs/env', () => ({
  env: { apiUrl: 'https://api.test.com/api/v1', wsUrl: 'wss://api.test.com' },
}));
jest.mock('axios', () => ({
  __esModule: true,
  default: { post: jest.fn(async () => ({ data: { access: 'new-token', refresh: 'new-refresh' } })) },
  post: jest.fn(async () => ({ data: { access: 'new-token', refresh: 'new-refresh' } })),
}));

let mockWsInstances: MockWebSocket[] = [];

class MockWebSocket {
  url: string;
  readyState = 1;
  onopen: ((ev: any) => void) | null = null;
  onmessage: ((ev: any) => void) | null = null;
  onclose: ((ev: any) => void) | null = null;
  onerror: ((ev: any) => void) | null = null;
  sent: string[] = [];

  static OPEN = 1;
  static CLOSED = 3;

  constructor(url: string) {
    this.url = url;
    mockWsInstances.push(this);
    setTimeout(() => this.onopen?.({} as any), 0);
  }
  send(data: string) { this.sent.push(data); }
  close() { this.readyState = 3; }
}

(globalThis as any).WebSocket = MockWebSocket;

import { wsManager } from '@/services/websocket';

describe('WebSocketManager', () => {
  beforeEach(() => {
    mockWsInstances = [];
    wsManager.disconnect();
    jest.clearAllMocks();
  });

  it('connects to the correct URL', () => {
    wsManager.connect('/ws/user/');
    expect(mockWsInstances.length).toBeGreaterThanOrEqual(1);
    const ws = mockWsInstances[mockWsInstances.length - 1];
    expect(ws.url).toBe('wss://api.test.com/ws/user/');
  });

  it('registers and unregisters event handlers', () => {
    const handler = jest.fn();
    const unsub = wsManager.on('test.event', handler);
    expect(typeof unsub).toBe('function');
    unsub();
  });

  it('disconnect clears the WebSocket', () => {
    wsManager.connect('/ws/user/');
    wsManager.disconnect();
    expect(mockWsInstances[mockWsInstances.length - 1].readyState).toBe(3);
  });

  it('send does nothing when not connected', () => {
    wsManager.disconnect();
    wsManager.send({ type: 'ping' });
  });

  it('on("*") receives all message types', async () => {
    const handler = jest.fn();
    wsManager.on('*', handler);
    wsManager.connect('/ws/user/');

    await new Promise((r) => setTimeout(r, 10));
    const ws = mockWsInstances[mockWsInstances.length - 1];
    ws.onmessage?.({ data: JSON.stringify({ type: 'auth.success' }) } as any);
    ws.onmessage?.({ data: JSON.stringify({ type: 'custom.msg', payload: 1 }) } as any);
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ type: 'custom.msg' }));
  });
});
