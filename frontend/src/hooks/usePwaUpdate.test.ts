import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { usePwaUpdate } from './usePwaUpdate';

// Mock the sw/pwa module
vi.mock('../sw/pwa', () => {
  let handler: (() => void) | null = null;
  return {
    setUpdatePromptHandler: vi.fn((h: () => void) => {
      handler = h;
    }),
    triggerUpdate: vi.fn(),
    // Helper to simulate the service worker firing the prompt
    __simulateUpdate: () => handler?.(),
  };
});

// Import after mock is set up
const pwa = await import('../sw/pwa') as unknown as {
  triggerUpdate: ReturnType<typeof vi.fn>;
  __simulateUpdate: () => void;
};
const { triggerUpdate, __simulateUpdate } = pwa;

describe('usePwaUpdate', () => {
  it('starts with showUpdate false', () => {
    const { result } = renderHook(() => usePwaUpdate());
    expect(result.current.showUpdate).toBe(false);
  });

  it('sets showUpdate to true when service worker fires update', () => {
    const { result } = renderHook(() => usePwaUpdate());

    act(() => {
      __simulateUpdate();
    });

    expect(result.current.showUpdate).toBe(true);
  });

  it('applyUpdate calls triggerUpdate and hides the banner', () => {
    const { result } = renderHook(() => usePwaUpdate());

    act(() => {
      __simulateUpdate();
    });
    expect(result.current.showUpdate).toBe(true);

    act(() => {
      result.current.applyUpdate();
    });

    expect(result.current.showUpdate).toBe(false);
    expect(triggerUpdate).toHaveBeenCalled();
  });

  it('dismissUpdate hides the banner without updating', () => {
    const { result } = renderHook(() => usePwaUpdate());

    act(() => {
      __simulateUpdate();
    });
    expect(result.current.showUpdate).toBe(true);

    act(() => {
      result.current.dismissUpdate();
    });

    expect(result.current.showUpdate).toBe(false);
    expect(triggerUpdate).not.toHaveBeenCalled();
  });
});
