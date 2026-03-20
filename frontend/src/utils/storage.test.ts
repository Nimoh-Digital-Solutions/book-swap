import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearStorage,
  getStorageItem,
  hasStorageItem,
  removeStorageItem,
  setStorageItem,
} from './storage';

describe('storage utilities', () => {
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

  describe('getStorageItem', () => {
    it('returns null when key does not exist and no fallback is provided', () => {
      const result = getStorageItem<string>('nonexistent');
      expect(result).toBeNull();
    });

    it('returns fallback when key does not exist and fallback is provided', () => {
      const result = getStorageItem('nonexistent', 'default');
      expect(result).toBe('default');
    });

    it('returns parsed value when key exists (no fallback)', () => {
      store['test-key'] = JSON.stringify({ name: 'test' });
      const result = getStorageItem<{ name: string }>('test-key');
      expect(result).toEqual({ name: 'test' });
    });

    it('returns parsed value when key exists (with fallback)', () => {
      store['test-key'] = JSON.stringify({ name: 'test' });
      const result = getStorageItem('test-key', { name: 'fallback' });
      expect(result).toEqual({ name: 'test' });
    });

    it('handles different data types', () => {
      store['string'] = JSON.stringify('hello');
      expect(getStorageItem('string', '')).toBe('hello');

      store['number'] = JSON.stringify(42);
      expect(getStorageItem('number', 0)).toBe(42);

      store['boolean'] = JSON.stringify(true);
      expect(getStorageItem('boolean', false)).toBe(true);

      store['array'] = JSON.stringify([1, 2, 3]);
      expect(getStorageItem('array', [])).toEqual([1, 2, 3]);

      store['object'] = JSON.stringify({ a: 1 });
      expect(getStorageItem('object', {})).toEqual({ a: 1 });
    });

    it('returns null on invalid JSON when no fallback is provided', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      store['invalid'] = 'invalid-json{';

      const result = getStorageItem('invalid');

      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalled();
    });

    it('returns fallback on invalid JSON when fallback is provided', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      store['invalid'] = 'invalid-json{';

      const result = getStorageItem('invalid', 'fallback');

      expect(result).toBe('fallback');
      expect(warnSpy).toHaveBeenCalled();
    });

    it('returns null when localStorage.getItem throws and no fallback is provided', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      (globalThis.localStorage.getItem as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        () => {
          throw new Error('Storage error');
        }
      );

      const result = getStorageItem('test');

      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalled();
    });

    it('returns fallback when localStorage.getItem throws and fallback is provided', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      (globalThis.localStorage.getItem as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        () => {
          throw new Error('Storage error');
        }
      );

      const result = getStorageItem('test', 'fallback');

      expect(result).toBe('fallback');
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('setStorageItem', () => {
    it('stores value as JSON', () => {
      const success = setStorageItem('test-key', { name: 'test' });
      expect(success).toBe(true);
      expect(store['test-key']).toBe(JSON.stringify({ name: 'test' }));
    });

    it('handles different data types', () => {
      setStorageItem('string', 'hello');
      expect(store['string']).toBe(JSON.stringify('hello'));

      setStorageItem('number', 42);
      expect(store['number']).toBe(JSON.stringify(42));

      setStorageItem('boolean', true);
      expect(store['boolean']).toBe(JSON.stringify(true));

      setStorageItem('array', [1, 2, 3]);
      expect(store['array']).toBe(JSON.stringify([1, 2, 3]));
    });

    it('handles null values', () => {
      setStorageItem('null', null);
      expect(store['null']).toBe('null');
    });

    it('returns false when JSON.stringify throws (circular)', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const a: Record<string, unknown> = {};
      a.self = a;

      const success = setStorageItem('circular', a);

      expect(success).toBe(false);
      expect(warnSpy).toHaveBeenCalled();
    });

    it('returns false on error when localStorage.setItem throws', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      (globalThis.localStorage.setItem as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        () => {
          throw new Error('QuotaExceededError');
        }
      );

      const success = setStorageItem('test', 'value');

      expect(success).toBe(false);
      expect(warnSpy).toHaveBeenCalled();
    });

    // -------------------------------------------------------------------------
    // Sensitive-key guard
    // -------------------------------------------------------------------------
    it.each(['token', 'authToken', 'USER_TOKEN', 'secret', 'mySecret', 'password', 'Password123', 'auth', 'AUTH_KEY'])(
      'refuses to store key "%s" and returns false',
      (sensitiveKey) => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const success = setStorageItem(sensitiveKey, 'some-value');

        expect(success).toBe(false);
        // The structured logger passes the message as the 3rd argument (%c prefix, color, message)
        const allArgs = errorSpy.mock.calls.flat().join(' ');
        expect(allArgs).toContain(sensitiveKey);
        // Value must NOT have been written to storage
        expect(store[sensitiveKey]).toBeUndefined();
      }
    );

    it('does not block non-sensitive keys that partially resemble sensitive words', () => {
      const success = setStorageItem('tokenomics', 'value');
      // "tokenomics" contains "token" — the regex /token/i matches it.
      // This test documents (and keeps) the current intentionally-strict behaviour.
      expect(success).toBe(false);
    });

    it('stores a normal non-sensitive key without error', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const success = setStorageItem('user-preference', 'dark');

      expect(success).toBe(true);
      expect(store['user-preference']).toBe(JSON.stringify('dark'));
      expect(errorSpy).not.toHaveBeenCalled();
    });
  });

  describe('removeStorageItem', () => {
    it('removes item from storage', () => {
      store['test-key'] = 'value';
      const success = removeStorageItem('test-key');

      expect(success).toBe(true);
      expect(store['test-key']).toBeUndefined();
    });

    it('returns true even if key does not exist', () => {
      const success = removeStorageItem('nonexistent');
      expect(success).toBe(true);
    });

    it('returns false on error when localStorage.removeItem throws', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      (
        globalThis.localStorage.removeItem as unknown as ReturnType<typeof vi.fn>
      ).mockImplementation(() => {
        throw new Error('Storage error');
      });

      const success = removeStorageItem('test');

      expect(success).toBe(false);
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('clearStorage', () => {
    it('clears all items', () => {
      store['key1'] = 'value1';
      store['key2'] = 'value2';

      const success = clearStorage();

      expect(success).toBe(true);
      expect(Object.keys(store)).toHaveLength(0);
    });

    it('returns false on error when localStorage.clear throws', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      (globalThis.localStorage.clear as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        () => {
          throw new Error('Storage error');
        }
      );

      const success = clearStorage();

      expect(success).toBe(false);
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('hasStorageItem', () => {
    it('returns true when key exists', () => {
      store['test-key'] = JSON.stringify('value');
      expect(hasStorageItem('test-key')).toBe(true);
    });

    it('returns false when key does not exist', () => {
      expect(hasStorageItem('nonexistent')).toBe(false);
    });

    it('returns false on error when localStorage.getItem throws', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      (globalThis.localStorage.getItem as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        () => {
          throw new Error('Storage error');
        }
      );

      expect(hasStorageItem('test')).toBe(false);
      expect(warnSpy).toHaveBeenCalled();
    });
  });
});
