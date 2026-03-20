// ---------------------------------------------------------------------------
// Sensitive-key guard
// Refuse to store values whose key name suggests sensitive data.
// Extend this list as the project grows.
//
// AUTH TOKEN STORAGE STRATEGY (intentional design decision):
// - The JWT **access token** is stored in Zustand (in-memory only) and is
//   intentionally NOT persisted to localStorage. This guard ensures that
//   no code accidentally writes token/auth/password data to localStorage.
// - The JWT **refresh token** is an httpOnly cookie managed entirely by the
//   browser — the FE never sees or stores it.
// - On page refresh the access token is lost, but `useInitAuth` performs a
//   silent refresh via the httpOnly cookie to restore the session.
// ---------------------------------------------------------------------------
import { logger } from './logger';

const SENSITIVE_KEY_PATTERNS = [/token/i, /secret/i, /password/i, /auth/i];

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some(p => p.test(key));
}

// ---------------------------------------------------------------------------
// Internal helper — eliminates the identical try/catch/return boilerplate
// that was copy-pasted across every mutating storage function.
// ---------------------------------------------------------------------------
function trySyncStorage(op: () => void, warnMsg: string): boolean {
  try {
    op();
    return true;
  } catch (error) {
    logger.warn(warnMsg, { error });
    return false;
  }
}

/**
 * Safely get an item from localStorage and parse it as JSON
 *
 * Usage:
 *  getStorageItem('theme', 'light')        -> string
 *  getStorageItem<User>('user')            -> User | null
 */
export function getStorageItem<T>(key: string): T | null;
export function getStorageItem<T>(key: string, fallback: T): T;
export function getStorageItem<T>(key: string, fallback?: T): T | null {
  try {
    const item = localStorage.getItem(key);

    if (item === null) {
      return fallback ?? null;
    }

    return JSON.parse(item) as T;
  } catch (error) {
    logger.warn(`Error reading localStorage key "${key}"`, { error });
    return fallback ?? null;
  }
}

/**
 * Safely set an item in localStorage as JSON.
 * Refuses to store values whose key matches a sensitive-data pattern
 * (token, secret, password, auth) to prevent accidental plaintext storage.
 * @returns true if successful, false otherwise
 */
export function setStorageItem<T>(key: string, value: T): boolean {
  if (isSensitiveKey(key)) {
    logger.error(`[storage] Refusing to store sensitive key "${key}" in localStorage`);
    return false;
  }

  return trySyncStorage(
    () => localStorage.setItem(key, JSON.stringify(value)),
    `Error setting localStorage key "${key}":`
  );
}

/**
 * Remove an item from localStorage
 * @returns true if successful, false otherwise
 */
export function removeStorageItem(key: string): boolean {
  return trySyncStorage(
    () => localStorage.removeItem(key),
    `Error removing localStorage key "${key}":`
  );
}

/**
 * Clear all items from localStorage
 * @returns true if successful, false otherwise
 */
export function clearStorage(): boolean {
  return trySyncStorage(() => localStorage.clear(), 'Error clearing localStorage:');
}

/**
 * Check if a key exists in localStorage
 * @returns true if the key exists, false otherwise
 */
export function hasStorageItem(key: string): boolean {
  try {
    return localStorage.getItem(key) !== null;
  } catch (error) {
    logger.warn(`Error checking localStorage key "${key}"`, { error });
    return false;
  }
}
