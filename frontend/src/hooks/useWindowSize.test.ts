import { act,renderHook } from '@testing-library/react';
import { afterEach,describe, expect, it, vi } from 'vitest';

import { useWindowSize } from './useWindowSize';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useWindowSize', () => {
  it('returns the current window dimensions on mount', () => {
    // JSDOM sets innerWidth/innerHeight to 1024×768 by default
    const { result } = renderHook(() => useWindowSize());
    expect(result.current.width).toBe(window.innerWidth);
    expect(result.current.height).toBe(window.innerHeight);
  });

  it('updates after a resize event fires and the debounce delay elapses', async () => {
    const { result } = renderHook(() => useWindowSize());

    await act(async () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 300 });
      window.dispatchEvent(new Event('resize'));
      // Wait for the 100ms debounce
      await new Promise(r => setTimeout(r, 120));
    });

    expect(result.current.width).toBe(500);
    expect(result.current.height).toBe(300);
  });

  it('removes the resize listener on unmount', () => {
    const spy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useWindowSize());
    unmount();
    expect(spy).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});
