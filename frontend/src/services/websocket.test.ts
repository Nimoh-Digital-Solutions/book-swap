import { afterEach,beforeEach, describe, expect, it, vi } from 'vitest';

import { createWebSocket } from './websocket';
import type { WsMessage } from './websocket.types';
import { WS_CLOSE_CODES } from './websocket.types';

// ---------------------------------------------------------------------------
// WebSocket mock
// ---------------------------------------------------------------------------

/** Minimal mock that simulates WebSocket behaviour for unit tests. */
class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  url: string;
  readyState = MockWebSocket.CONNECTING;

  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;

  private sentMessages: string[] = [];

  constructor(url: string) {
    this.url = url;
    // Record every instance for test assertions
    mockInstances.push(this);
  }

  send(data: string): void {
    this.sentMessages.push(data);
  }

  close(code = 1000, reason = ''): void {
    this.readyState = MockWebSocket.CLOSING;
    // Simulate async close
    queueMicrotask(() => {
      this.readyState = MockWebSocket.CLOSED;
      this.onclose?.(new CloseEvent('close', { code, reason }));
    });
  }

  // -- Test helpers ----------------------------------------------------------

  /** Simulate the server accepting the connection. */
  simulateOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.(new Event('open'));
  }

  /** Simulate a JSON message from the server. */
  simulateMessage(data: WsMessage): void {
    this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(data) }));
  }

  /** Simulate a non-JSON message. */
  simulateRawMessage(data: string): void {
    this.onmessage?.(new MessageEvent('message', { data }));
  }

  /** Simulate the server closing the connection. */
  simulateClose(code = 1000, reason = ''): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close', { code, reason }));
  }

  /** Simulate an error event. */
  simulateError(): void {
    this.onerror?.(new Event('error'));
  }

  getSentMessages(): string[] {
    return this.sentMessages;
  }
}

let mockInstances: MockWebSocket[] = [];

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  mockInstances = [];
  vi.stubGlobal('WebSocket', MockWebSocket);
  // Silence Sentry breadcrumb calls
  vi.mock('@configs/sentry', () => ({
    addBreadcrumb: vi.fn(),
  }));
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createWebSocket', () => {
  it('connects to the URL with token appended as query param', () => {
    createWebSocket({
      url: 'wss://api.example.com/ws/stories/42/',
      token: 'jwt-token-123',
      onMessage: vi.fn(),
    });

    expect(mockInstances).toHaveLength(1);
    expect(mockInstances[0]?.url).toBe(
      'wss://api.example.com/ws/stories/42/?token=jwt-token-123',
    );
  });

  it('appends token with & when URL already has query params', () => {
    createWebSocket({
      url: 'wss://api.example.com/ws/?foo=bar',
      token: 'tok',
      onMessage: vi.fn(),
    });

    expect(mockInstances[0]?.url).toBe(
      'wss://api.example.com/ws/?foo=bar&token=tok',
    );
  });

  it('calls onMessage with parsed WsMessage on valid JSON', () => {
    const onMessage = vi.fn();
    createWebSocket({
      url: 'wss://localhost/ws/',
      token: 'tok',
      onMessage,
    });

    const ws = mockInstances[0]!;
    ws.simulateOpen();
    ws.simulateMessage({ type: 'chunk', chunk: 'Hello' });

    expect(onMessage).toHaveBeenCalledWith({ type: 'chunk', chunk: 'Hello' });
  });

  it('does not call onMessage for invalid JSON', () => {
    const onMessage = vi.fn();
    createWebSocket({
      url: 'wss://localhost/ws/',
      token: 'tok',
      onMessage,
    });

    const ws = mockInstances[0]!;
    ws.simulateOpen();
    ws.simulateRawMessage('not valid json');

    expect(onMessage).not.toHaveBeenCalled();
  });

  it('calls onOpen when connection is established', () => {
    const onOpen = vi.fn();
    createWebSocket({
      url: 'wss://localhost/ws/',
      token: 'tok',
      onMessage: vi.fn(),
      onOpen,
    });

    mockInstances[0]!.simulateOpen();
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when connection closes', () => {
    const onClose = vi.fn();
    createWebSocket({
      url: 'wss://localhost/ws/',
      token: 'tok',
      onMessage: vi.fn(),
      onClose,
    });

    const ws = mockInstances[0]!;
    ws.simulateOpen();
    ws.simulateClose(1000, 'Normal');

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0]?.[0].code).toBe(1000);
  });

  it('calls onError on error events', () => {
    const onError = vi.fn();
    createWebSocket({
      url: 'wss://localhost/ws/',
      token: 'tok',
      onMessage: vi.fn(),
      onError,
    });

    mockInstances[0]!.simulateError();
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('send() serialises data as JSON', () => {
    const handle = createWebSocket({
      url: 'wss://localhost/ws/',
      token: 'tok',
      onMessage: vi.fn(),
    });

    const ws = mockInstances[0]!;
    ws.simulateOpen();
    handle.send({ action: 'ping' });

    expect(ws.getSentMessages()).toEqual(['{"action":"ping"}']);
  });

  it('close() prevents auto-reconnect', () => {
    vi.useFakeTimers();
    const handle = createWebSocket({
      url: 'wss://localhost/ws/',
      token: 'tok',
      onMessage: vi.fn(),
      reconnect: true,
      maxRetries: 3,
    });

    handle.close();
    // The close triggers no new connections
    vi.advanceTimersByTime(30_000);
    expect(mockInstances).toHaveLength(1);
    vi.useRealTimers();
  });

  it('does not reconnect for FORBIDDEN close code', () => {
    vi.useFakeTimers();
    createWebSocket({
      url: 'wss://localhost/ws/',
      token: 'tok',
      onMessage: vi.fn(),
      reconnect: true,
      maxRetries: 3,
    });

    mockInstances[0]!.simulateClose(WS_CLOSE_CODES.FORBIDDEN, 'Forbidden');
    vi.advanceTimersByTime(30_000);

    // Only the original connection, no retries
    expect(mockInstances).toHaveLength(1);
    vi.useRealTimers();
  });

  it('does not reconnect for NOT_FOUND close code', () => {
    vi.useFakeTimers();
    createWebSocket({
      url: 'wss://localhost/ws/',
      token: 'tok',
      onMessage: vi.fn(),
      reconnect: true,
      maxRetries: 3,
    });

    mockInstances[0]!.simulateClose(WS_CLOSE_CODES.NOT_FOUND, 'Not found');
    vi.advanceTimersByTime(30_000);

    expect(mockInstances).toHaveLength(1);
    vi.useRealTimers();
  });

  it('reconnects on abnormal close with exponential backoff', () => {
    vi.useFakeTimers();
    createWebSocket({
      url: 'wss://localhost/ws/',
      token: 'tok',
      onMessage: vi.fn(),
      reconnect: true,
      maxRetries: 3,
      baseDelay: 100,
    });

    // Simulate abnormal close (code 1006 — abnormal)
    mockInstances[0]!.simulateClose(1006, 'Abnormal');

    // Should NOT have reconnected immediately
    expect(mockInstances).toHaveLength(1);

    // Advance past the first backoff (~100 ms base + jitter)
    vi.advanceTimersByTime(200);
    expect(mockInstances).toHaveLength(2);

    vi.useRealTimers();
  });

  it('stops reconnecting after maxRetries', () => {
    vi.useFakeTimers();
    createWebSocket({
      url: 'wss://localhost/ws/',
      token: 'tok',
      onMessage: vi.fn(),
      reconnect: true,
      maxRetries: 2,
      baseDelay: 50,
    });

    // First abnormal close → retry 1
    mockInstances[0]!.simulateClose(1006);
    vi.advanceTimersByTime(200);
    expect(mockInstances).toHaveLength(2);

    // Second abnormal close → retry 2
    mockInstances[1]!.simulateClose(1006);
    vi.advanceTimersByTime(400);
    expect(mockInstances).toHaveLength(3);

    // Third close — max retries reached, no more connections
    mockInstances[2]!.simulateClose(1006);
    vi.advanceTimersByTime(10_000);
    expect(mockInstances).toHaveLength(3);

    vi.useRealTimers();
  });

  it('does not reconnect when reconnect option is false', () => {
    vi.useFakeTimers();
    createWebSocket({
      url: 'wss://localhost/ws/',
      token: 'tok',
      onMessage: vi.fn(),
      reconnect: false,
    });

    mockInstances[0]!.simulateClose(1006);
    vi.advanceTimersByTime(30_000);

    expect(mockInstances).toHaveLength(1);
    vi.useRealTimers();
  });

  it('readyState() returns current socket state', () => {
    const handle = createWebSocket({
      url: 'wss://localhost/ws/',
      token: 'tok',
      onMessage: vi.fn(),
    });

    expect(handle.readyState()).toBe(MockWebSocket.CONNECTING);

    mockInstances[0]!.simulateOpen();
    expect(handle.readyState()).toBe(MockWebSocket.OPEN);
  });

  it('resets retry count on successful reconnection', () => {
    vi.useFakeTimers();
    createWebSocket({
      url: 'wss://localhost/ws/',
      token: 'tok',
      onMessage: vi.fn(),
      reconnect: true,
      maxRetries: 5,
      baseDelay: 50,
    });

    // First close → retry
    mockInstances[0]!.simulateClose(1006);
    vi.advanceTimersByTime(200);
    expect(mockInstances).toHaveLength(2);

    // Successful reconnection → retry count resets
    mockInstances[1]!.simulateOpen();

    // Close again → should still be able to retry (not exhausted)
    mockInstances[1]!.simulateClose(1006);
    vi.advanceTimersByTime(200);
    expect(mockInstances).toHaveLength(3);

    vi.useRealTimers();
  });
});
