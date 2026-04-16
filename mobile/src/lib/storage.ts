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
    // eslint-disable-next-line @typescript-eslint/no-require-imports
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
    if (Platform.OS === 'web') return sessionStorage.getItem(key);
    return SecureStore.getItem(key);
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
      void SecureStore.deleteItemAsync(key);
    }
  },
};

const Keys = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  BIOMETRIC_ENABLED: 'biometric_enabled',
} as const;

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
  getBiometricEnabled: (): boolean => kv.get(Keys.BIOMETRIC_ENABLED) === 'true',
  setBiometricEnabled: (value: boolean) => {
    kv.set(Keys.BIOMETRIC_ENABLED, String(value));
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
