import { act,renderHook } from '@testing-library/react';
import { afterEach,beforeEach, describe, expect, it, vi } from 'vitest';

import { useMediaQuery } from './useMediaQuery';

// JSDOM does not implement matchMedia — provide a working stub.
function createMatchMediaMock(matches: boolean) {
  const listeners: ((e: Partial<MediaQueryListEvent>) => void)[] = [];
  return {
    matches,
    addEventListener: vi.fn((_type: string, listener: (e: Partial<MediaQueryListEvent>) => void) => {
      listeners.push(listener);
    }),
    removeEventListener: vi.fn((_type: string, listener: (e: Partial<MediaQueryListEvent>) => void) => {
      const idx = listeners.indexOf(listener);
      if (idx !== -1) listeners.splice(idx, 1);
    }),
    // Helper to simulate a media query change from tests
    _fire: (newMatches: boolean) => {
      listeners.forEach(l => l({ matches: newMatches }));
    },
  };
}

let mockMql: ReturnType<typeof createMatchMediaMock>;

beforeEach(() => {
  mockMql = createMatchMediaMock(false);
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockReturnValue(mockMql),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useMediaQuery', () => {
  it('returns false when the query does not match', () => {
    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));
    expect(result.current).toBe(false);
  });

  it('returns true when the query matches initially', () => {
    mockMql = createMatchMediaMock(true);
    (window.matchMedia as ReturnType<typeof vi.fn>).mockReturnValue(mockMql);
    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));
    expect(result.current).toBe(true);
  });

  it('updates when the media query fires a change event', () => {
    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));
    expect(result.current).toBe(false);

    act(() => { mockMql._fire(true); });
    expect(result.current).toBe(true);

    act(() => { mockMql._fire(false); });
    expect(result.current).toBe(false);
  });

  it('removes the event listener on unmount', () => {
    const { unmount } = renderHook(() => useMediaQuery('(max-width: 768px)'));
    unmount();
    expect(mockMql.removeEventListener).toHaveBeenCalledOnce();
  });
});
