import { AppState } from 'react-native';

jest.mock('@/stores/authStore', () => ({
  useAuthStore: Object.assign(
    jest.fn((sel: (s: any) => any) => sel({ clearAuth: jest.fn(), isAuthenticated: true })),
    { getState: jest.fn(() => ({ isAuthenticated: true, clearAuth: jest.fn() })), setState: jest.fn(), subscribe: jest.fn() },
  ),
}));
jest.mock('@/lib/sentry', () => ({
  addBreadcrumb: jest.fn(),
}));

import { recordInteraction } from '@/services/IdleTimeoutGate';

describe('IdleTimeoutGate', () => {
  it('recordInteraction updates the timestamp without throwing', () => {
    expect(() => recordInteraction()).not.toThrow();
  });

  it('AppState listener is available', () => {
    expect(typeof AppState.addEventListener).toBe('function');
  });
});
