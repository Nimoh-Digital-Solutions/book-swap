import { act,renderHook } from '@testing-library/react';
import { afterEach,beforeEach, describe, expect, it, vi } from 'vitest';

import type { WsMessage } from './websocket.types';

// ---------------------------------------------------------------------------
// Mocks — must be defined BEFORE the module under test is imported
// ---------------------------------------------------------------------------

// Mock WebSocket handle returned by createWebSocket
const mockSend = vi.fn();
const mockClose = vi.fn();
let mockOnMessage: ((message: WsMessage) => void) | null = null;
let mockOnOpen: ((event: Event) => void) | null = null;
let mockOnClose: ((event: CloseEvent) => void) | null = null;
let createWebSocketCallCount = 0;

vi.mock('./websocket', () => ({
  createWebSocket: vi.fn((options: {
    onMessage: (msg: WsMessage) => void;
    onOpen?: (e: Event) => void;
    onClose?: (e: CloseEvent) => void;
  }) => {
    createWebSocketCallCount += 1;
    mockOnMessage = options.onMessage;
    mockOnOpen = options.onOpen ?? null;
    mockOnClose = options.onClose ?? null;
    return {
      send: mockSend,
      close: mockClose,
      readyState: () => 1, // OPEN
    };
  }),
}));

vi.mock('@configs/sentry', () => ({
  addBreadcrumb: vi.fn(),
}));

// Mock auth store
vi.mock('@features/auth/stores/authStore', () => ({
  useAuthStore: Object.assign(
    vi.fn(() => ({ accessToken: 'test-token' })),
    {
      getState: vi.fn(() => ({
        accessToken: 'test-token',
        refreshToken: vi.fn().mockResolvedValue(true),
      })),
    },
  ),
}));

// Now import the module under test
import { useWebSocket } from './useWebSocket';

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  mockOnMessage = null;
  mockOnOpen = null;
  mockOnClose = null;
  mockSend.mockClear();
  mockClose.mockClear();
  createWebSocketCallCount = 0;
});

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useWebSocket', () => {
  it('returns initial disconnected state', () => {
    const { result } = renderHook(() =>
      useWebSocket({ url: 'wss://localhost/ws/', enabled: true }),
    );

    expect(result.current.isConnected).toBe(false);
    expect(result.current.lastMessage).toBeNull();
    expect(typeof result.current.send).toBe('function');
    expect(typeof result.current.close).toBe('function');
  });

  it('does not connect when enabled is false', () => {
    renderHook(() =>
      useWebSocket({ url: 'wss://localhost/ws/', enabled: false }),
    );

    expect(createWebSocketCallCount).toBe(0);
  });

  it('sets isConnected to true when onOpen fires', () => {
    const { result } = renderHook(() =>
      useWebSocket({ url: 'wss://localhost/ws/', enabled: true }),
    );

    act(() => {
      mockOnOpen?.(new Event('open'));
    });

    expect(result.current.isConnected).toBe(true);
  });

  it('updates lastMessage when a message arrives', () => {
    const { result } = renderHook(() =>
      useWebSocket({ url: 'wss://localhost/ws/', enabled: true }),
    );

    act(() => {
      mockOnOpen?.(new Event('open'));
      mockOnMessage?.({ type: 'chunk', chunk: 'Hello' });
    });

    expect(result.current.lastMessage).toEqual({ type: 'chunk', chunk: 'Hello' });
  });

  it('calls user-provided onMessage callback', () => {
    const userOnMessage = vi.fn();
    renderHook(() =>
      useWebSocket({
        url: 'wss://localhost/ws/',
        enabled: true,
        onMessage: userOnMessage,
      }),
    );

    act(() => {
      mockOnMessage?.({ type: 'error', message: 'fail' });
    });

    expect(userOnMessage).toHaveBeenCalledWith({ type: 'error', message: 'fail' });
  });

  it('sets isConnected to false on close', () => {
    const { result } = renderHook(() =>
      useWebSocket({ url: 'wss://localhost/ws/', enabled: true }),
    );

    act(() => {
      mockOnOpen?.(new Event('open'));
    });
    expect(result.current.isConnected).toBe(true);

    act(() => {
      mockOnClose?.(new CloseEvent('close', { code: 1000 }));
    });
    expect(result.current.isConnected).toBe(false);
  });

  it('closes connection on unmount', () => {
    const { unmount } = renderHook(() =>
      useWebSocket({ url: 'wss://localhost/ws/', enabled: true }),
    );

    unmount();
    expect(mockClose).toHaveBeenCalled();
  });

  it('send() delegates to the WebSocket handle', () => {
    const { result } = renderHook(() =>
      useWebSocket({ url: 'wss://localhost/ws/', enabled: true }),
    );

    act(() => {
      result.current.send({ action: 'start' });
    });

    expect(mockSend).toHaveBeenCalledWith({ action: 'start' });
  });
});
