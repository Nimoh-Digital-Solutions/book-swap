import * as SecureStore from 'expo-secure-store';
import { tokenStorage, asyncQueryStorage } from '@/lib/storage';

const mockAsyncStorageState: Record<string, string> = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (key: string) => mockAsyncStorageState[key] ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      mockAsyncStorageState[key] = value;
    }),
    removeItem: jest.fn(async (key: string) => {
      delete mockAsyncStorageState[key];
    }),
  },
}));

describe('storage', () => {
  let secureState: Record<string, string>;

  beforeEach(() => {
    secureState = {};
    Object.keys(mockAsyncStorageState).forEach((k) => {
      delete mockAsyncStorageState[k];
    });
    jest.mocked(SecureStore.getItem).mockImplementation((key: string) => secureState[key] ?? null);
    jest.mocked(SecureStore.setItem).mockImplementation((key: string, value: string) => {
      secureState[key] = value;
    });
    jest.mocked(SecureStore.deleteItemAsync).mockImplementation(async (key: string) => {
      delete secureState[key];
    });
  });

  describe('tokenStorage', () => {
    it('setTokens stores both tokens', () => {
      tokenStorage.setTokens('access-a', 'refresh-b');
      expect(secureState.access_token).toBe('access-a');
      expect(secureState.refresh_token).toBe('refresh-b');
    });

    it('getAccess returns stored value', () => {
      tokenStorage.setTokens('my-access', 'my-refresh');
      expect(tokenStorage.getAccess()).toBe('my-access');
    });

    it('clearAll removes tokens', () => {
      tokenStorage.setTokens('a', 'b');
      tokenStorage.clearAll();
      expect(tokenStorage.getAccess()).toBeNull();
      expect(tokenStorage.getRefresh()).toBeNull();
    });

    it('getBiometricEnabled returns false by default', () => {
      expect(tokenStorage.getBiometricEnabled()).toBe(false);
    });
  });

  describe('asyncQueryStorage', () => {
    it('getItem returns null for missing key', async () => {
      await expect(asyncQueryStorage.getItem('missing-key')).resolves.toBeNull();
    });

    it('setItem and getItem roundtrip', async () => {
      await asyncQueryStorage.setItem('k1', 'v1');
      await expect(asyncQueryStorage.getItem('k1')).resolves.toBe('v1');
    });
  });
});
