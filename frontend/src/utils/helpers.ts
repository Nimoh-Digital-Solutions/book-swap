import { logger } from './logger';

/**
 * Debounce a function call (leading false, trailing true).
 * The returned function exposes a `.cancel()` method to clear any
 * pending invocation — useful for `useEffect` cleanup.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const debounced = (...args: Parameters<T>): void => {
    if (timeout !== undefined) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };

  debounced.cancel = (): void => {
    if (timeout !== undefined) {
      clearTimeout(timeout);
      timeout = undefined;
    }
  };

  return debounced;
}

/**
 * Throttle a function call (leading true, trailing false)
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (inThrottle) return;

    func(...args);
    inThrottle = true;

    setTimeout(() => {
      inThrottle = false;
    }, limit);
  };
}

/**
 * Generate a random ID (UI-safe, not cryptographically secure)
 */
export function generateId(length = 9): string {
  // Prefer crypto when available
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID().replace(/-/g, '').slice(0, length);
  }

  return Math.random()
    .toString(36)
    .slice(2, 2 + length);
}

/**
 * Check if a value is empty:
 * - null/undefined -> true
 * - string -> trim length === 0
 * - array -> length === 0
 * - plain object -> no own enumerable keys
 * - Map/Set -> size === 0
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;

  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;

  if (value instanceof Map || value instanceof Set) return value.size === 0;

  if (typeof value === 'object') {
    // Treat only "plain-ish" objects as empty based on keys
    return Object.keys(value as Record<string, unknown>).length === 0;
  }

  return false;
}

/**
 * Deep clone (best effort):
 * - uses structuredClone when available
 * - falls back to manual clone for plain objects/arrays/dates
 *
 * Note: manual clone does not support circular refs, Map/Set/RegExp, class instances.
 */
export function deepClone<T>(obj: T): T {
  // Prefer built-in when available (handles many more cases)
  if (typeof globalThis.structuredClone === 'function') {
    try {
      return globalThis.structuredClone(obj);
    } catch (err) {
      logger.warn('[deepClone] structuredClone failed, falling back to manual clone', { err });
    }
  }

  if (obj === null || typeof obj !== 'object') return obj;

  if (obj instanceof Date) return new Date(obj.getTime()) as T;

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as T;
  }

  const clonedObj: Record<string, unknown> = {};
  for (const key in obj as Record<string, unknown>) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clonedObj[key] = deepClone((obj as Record<string, unknown>)[key]);
    }
  }
  return clonedObj as T;
}
