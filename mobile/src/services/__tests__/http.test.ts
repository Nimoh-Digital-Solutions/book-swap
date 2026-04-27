jest.mock('axios', () => {
  const instance = {
    defaults: {
      baseURL: 'https://api.test.com/api/v1',
      timeout: 30_000,
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Type': 'mobile',
        'User-Agent': 'BookSwap-Mobile/1.0',
      },
    },
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    request: jest.fn(),
  };
  return {
    __esModule: true,
    default: {
      create: jest.fn(() => instance),
      post: jest.fn(),
    },
    AxiosError: class AxiosError extends Error {
      response: any;
      code: string | undefined;
      config: any;
    },
  };
});

jest.mock('@/lib/storage', () => ({
  tokenStorage: {
    getAccess: jest.fn(() => 'mock-access-token'),
    getRefresh: jest.fn(() => 'mock-refresh-token'),
    setTokens: jest.fn(),
    clearAll: jest.fn(),
  },
}));
jest.mock('@/lib/sentry', () => ({
  captureException: jest.fn(),
  addBreadcrumb: jest.fn(),
}));
jest.mock('@/components/Toast', () => ({
  showErrorToast: jest.fn(),
}));
jest.mock('@/stores/authStore', () => ({
  useAuthStore: {
    getState: jest.fn(() => ({ logout: jest.fn() })),
  },
}));
jest.mock('@/configs/env', () => ({
  env: { apiUrl: 'https://api.test.com/api/v1', wsUrl: 'wss://api.test.com' },
}));
jest.mock('@/lib/i18n', () => ({
  __esModule: true,
  default: { t: jest.fn((key: string) => key) },
}));

import { isServerDegraded, subscribeCircuit, http } from '@/services/http';

describe('http service', () => {
  it('exports an http instance', () => {
    expect(http).toBeDefined();
  });

  it('isServerDegraded returns false initially', () => {
    expect(isServerDegraded()).toBe(false);
  });

  it('subscribeCircuit returns unsubscribe and allows multiple listeners', () => {
    const listener1 = jest.fn();
    const listener2 = jest.fn();
    const unsub1 = subscribeCircuit(listener1);
    const unsub2 = subscribeCircuit(listener2);
    expect(typeof unsub1).toBe('function');
    expect(typeof unsub2).toBe('function');
    unsub1();
    unsub2();
  });

  it('isServerDegraded stays false without server errors', () => {
    expect(isServerDegraded()).toBe(false);
    expect(isServerDegraded()).toBe(false);
  });
});
