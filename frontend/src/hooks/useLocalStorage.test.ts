import { useLocalStorage } from '@hooks';
import { act,renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('useLocalStorage', () => {
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};

    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
      key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
      get length() {
        return Object.keys(store).length;
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns initial value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    expect(result.current[0]).toBe('initial');
  });

  it('returns stored value when localStorage has data', () => {
    store['test-key'] = JSON.stringify('stored');

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    expect(result.current[0]).toBe('stored');
  });

  it('falls back to initial value when stored JSON is invalid', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    store['test-key'] = 'invalid-json{';

    const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'));
    expect(result.current[0]).toBe('fallback');
    expect(warnSpy).toHaveBeenCalled();
  });

  it('updates state and writes to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(store['test-key']).toBe(JSON.stringify('updated'));
  });

  it('supports functional updates (like useState)', () => {
    const { result } = renderHook(() => useLocalStorage('count', 0));

    act(() => {
      result.current[1](prev => prev + 1);
    });

    expect(result.current[0]).toBe(1);
    expect(store['count']).toBe(JSON.stringify(1));
  });

  it('works with objects', () => {
    type Obj = { a: number; b?: string };

    const { result } = renderHook(() => useLocalStorage<Obj>('obj', { a: 1 }));

    act(() => {
      result.current[1]({ a: 2, b: 'x' });
    });

    expect(result.current[0]).toEqual({ a: 2, b: 'x' });
    expect(JSON.parse(store['obj']!)).toEqual({ a: 2, b: 'x' });
  });

  it('still updates state even if localStorage.setItem throws', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    (globalThis.localStorage.setItem as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => {
        throw new Error('QuotaExceededError');
      }
    );

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      result.current[1]('new value');
    });

    // State updates regardless of storage failure
    expect(result.current[0]).toBe('new value');
    expect(warnSpy).toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // writeError (third tuple element)
  // -------------------------------------------------------------------------
  it('writeError is false initially', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    expect(result.current[2]).toBe(false);
  });

  it('writeError becomes true when localStorage.setItem throws', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    (globalThis.localStorage.setItem as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => {
        throw new Error('QuotaExceededError');
      }
    );

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      result.current[1]('value that fails to persist');
    });

    expect(result.current[2]).toBe(true);
  });

  it('writeError resets to false after a successful write following a failure', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const setItemMock = globalThis.localStorage.setItem as unknown as ReturnType<typeof vi.fn>;

    // First call throws
    setItemMock.mockImplementationOnce(() => {
      throw new Error('QuotaExceededError');
    });

    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    // Trigger failure
    act(() => {
      result.current[1]('failing value');
    });
    expect(result.current[2]).toBe(true);
    expect(warnSpy).toHaveBeenCalled();

    // Now let storage succeed again
    act(() => {
      result.current[1]('recovering value');
    });
    expect(result.current[2]).toBe(false);
  });
});
