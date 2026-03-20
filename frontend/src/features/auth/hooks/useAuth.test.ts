import { act,renderHook } from '@testing-library/react';
import { beforeEach,describe, expect, it } from 'vitest';

import { useAuthStore } from '../stores/authStore';
import { useAuth } from './useAuth';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resetStore() {
  useAuthStore.setState({
    accessToken: null,
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });
}

const mockUser = { id: 'usr_test_001', email: 'test@example.com', first_name: 'Test', last_name: 'User' };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useAuth', () => {
  beforeEach(resetStore);

  it('returns initial unauthenticated state', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.accessToken).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('reflects store changes when setAuth is called', () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.setAuth('tok_abc', mockUser);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.accessToken).toBe('tok_abc');
    expect(result.current.user).toEqual(mockUser);
  });

  it('reflects store changes when clearAuth is called', () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.setAuth('tok', mockUser);
    });
    expect(result.current.isAuthenticated).toBe(true);

    act(() => {
      result.current.clearAuth();
    });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.accessToken).toBeNull();
    expect(result.current.user).toBeNull();
  });

  it('exposes login, logout, and refreshToken actions', () => {
    const { result } = renderHook(() => useAuth());

    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.logout).toBe('function');
    expect(typeof result.current.refreshToken).toBe('function');
  });

  it('exposes error from store', () => {
    useAuthStore.setState({ error: 'Something went wrong' });
    const { result } = renderHook(() => useAuth());

    expect(result.current.error).toBe('Something went wrong');
  });
});
