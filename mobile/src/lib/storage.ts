import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await AsyncStorage.removeItem(key);
  },
};
