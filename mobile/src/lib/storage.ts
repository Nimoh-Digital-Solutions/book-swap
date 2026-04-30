import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

let AsyncStorage: typeof import('@react-native-async-storage/async-storage').default | null = null;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch {
  // Native module unavailable in some Expo Go versions
}

let mmkvInstance: import('react-native-mmkv').MMKV | null = null;
if (Platform.OS !== 'web') {
  try {
    const { MMKV } = require('react-native-mmkv');
    mmkvInstance = new MMKV({ id: 'bookswap-query-cache' });
  } catch {
    // Expo Go — MMKV unavailable
  }
}

const memoryStore = new Map<string, string>();

export const usesMmkv = mmkvInstance !== null;

const kv = {
  get(key: string): string | null {
    if (Platform.OS === 'web') return sessionStorage.getItem(key) || null;
    // Treat empty string as absent — clearTokens() writes '' synchronously
    // instead of using the async deleteItemAsync to avoid a race where a
    // pending delete fires after a subsequent setItem and wipes the new value.
    const val = SecureStore.getItem(key);
    return val || null;
  },
  set(key: string, value: string) {
    if (Platform.OS === 'web') {
      sessionStorage.setItem(key, value);
    } else {
      SecureStore.setItem(key, value);
    }
  },
  remove(key: string) {
    if (Platform.OS === 'web') {
      sessionStorage.removeItem(key);
    } else {
      // Overwrite synchronously with an empty sentinel so that any subsequent
      // setItem call on the same key (e.g. immediately after logout → re-login)
      // is not silently wiped by a still-pending deleteItemAsync.
      try {
        SecureStore.setItem(key, '');
      } catch {
        void SecureStore.deleteItemAsync(key);
      }
    }
  },
};

const Keys = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  PUSH_TOKEN: 'push_token',
  USER_JSON: 'bookswap_user_json_secure',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  ADD_BOOK_PREFERENCE: 'add_book_preference',
  DELETION_CANCEL_TOKEN: 'deletion_cancel_token',
} as const;

export type AddBookPreference = 'scan' | 'manual';

export const tokenStorage = {
  getAccess: (): string | null => kv.get(Keys.ACCESS_TOKEN),
  getRefresh: (): string | null => kv.get(Keys.REFRESH_TOKEN),
  setTokens: (accessToken: string, refreshToken: string) => {
    kv.set(Keys.ACCESS_TOKEN, accessToken);
    kv.set(Keys.REFRESH_TOKEN, refreshToken);
  },
  clearAll: () => {
    kv.remove(Keys.ACCESS_TOKEN);
    kv.remove(Keys.REFRESH_TOKEN);
  },
  getPushToken: (): string | null => kv.get(Keys.PUSH_TOKEN),
  setPushToken: (token: string) => kv.set(Keys.PUSH_TOKEN, token),
  clearPushToken: () => kv.remove(Keys.PUSH_TOKEN),
  getBiometricEnabled: (): boolean => kv.get(Keys.BIOMETRIC_ENABLED) === 'true',
  setBiometricEnabled: (value: boolean) => {
    kv.set(Keys.BIOMETRIC_ENABLED, String(value));
  },
};

export const secureUserStorage = {
  get: (): string | null => kv.get(Keys.USER_JSON),
  set: (value: string) => kv.set(Keys.USER_JSON, value),
  remove: () => kv.remove(Keys.USER_JSON),
};

export const deletionStorage = {
  getCancelToken: (): string | null => kv.get(Keys.DELETION_CANCEL_TOKEN),
  setCancelToken: (token: string) => kv.set(Keys.DELETION_CANCEL_TOKEN, token),
  clearCancelToken: () => kv.remove(Keys.DELETION_CANCEL_TOKEN),
};

export const prefsStorage = {
  getAddBookPref: (): AddBookPreference | null => {
    const val = kv.get(Keys.ADD_BOOK_PREFERENCE);
    return val === 'scan' || val === 'manual' ? val : null;
  },
  setAddBookPref: (value: AddBookPreference) => {
    kv.set(Keys.ADD_BOOK_PREFERENCE, value);
  },
  clearAddBookPref: () => {
    kv.remove(Keys.ADD_BOOK_PREFERENCE);
  },
};

export const syncQueryStorage = mmkvInstance
  ? {
      getItem: (key: string): string | null => mmkvInstance!.getString(key) ?? null,
      setItem: (key: string, value: string) => mmkvInstance!.set(key, value),
      removeItem: (key: string) => {
        mmkvInstance!.remove(key);
      },
    }
  : null;

export const asyncQueryStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    if (AsyncStorage) {
      try { return await AsyncStorage.getItem(key); } catch { /* native module unavailable */ }
    }
    return memoryStore.get(key) ?? null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') { localStorage.setItem(key, value); return; }
    if (AsyncStorage) {
      try { await AsyncStorage.setItem(key, value); return; } catch { /* native module unavailable */ }
    }
    memoryStore.set(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') { localStorage.removeItem(key); return; }
    if (AsyncStorage) {
      try { await AsyncStorage.removeItem(key); return; } catch { /* native module unavailable */ }
    }
    memoryStore.delete(key);
  },
};
