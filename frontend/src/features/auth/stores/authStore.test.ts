import { beforeEach,describe, expect, it, vi } from 'vitest';

import { getCsrfToken, setCsrfToken,useAuthStore } from './authStore';

// ---------------------------------------------------------------------------
// Mock the @services module to avoid circular dependency and network calls
// ---------------------------------------------------------------------------
vi.mock('@services', () => {
  const mockHttp = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    addRequestInterceptor: vi.fn(),
    addResponseInterceptor: vi.fn(),
    addErrorInterceptor: vi.fn(),
  };
  return { http: mockHttp };
});

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

describe('authStore', () => {
  beforeEach(() => {
    resetStore();
    setCsrfToken(null);
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------------
  // State management (synchronous actions)
  // -----------------------------------------------------------------------

  describe('setAuth', () => {
    it('sets token, user, and marks as authenticated', () => {
      useAuthStore.getState().setAuth('tok_123', mockUser);

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('tok_123');
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('clearAuth', () => {
    it('resets all auth state to initial values', () => {
      useAuthStore.getState().setAuth('tok', mockUser);
      useAuthStore.getState().clearAuth();

      const state = useAuthStore.getState();
      expect(state.accessToken).toBeNull();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // CSRF token (module-scoped)
  // -----------------------------------------------------------------------

  describe('CSRF token', () => {
    it('returns null by default', () => {
      expect(getCsrfToken()).toBeNull();
    });

    it('stores and retrieves a token', () => {
      setCsrfToken('csrf_abc');
      expect(getCsrfToken()).toBe('csrf_abc');
    });

    it('can be cleared', () => {
      setCsrfToken('csrf_abc');
      setCsrfToken(null);
      expect(getCsrfToken()).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // login
  // -----------------------------------------------------------------------

  describe('login', () => {
    it('sets isLoading while request is in flight', async () => {
      const { http } = await import('@services');
      (http.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          access: 'access_tok',
          expires_in: 900,
          token_type: 'Bearer',
          user: mockUser,
        },
        status: 200,
        message: 'OK',
      });

      const promise = useAuthStore.getState().login({ email_or_username: 'a@b.com', password: 'pw' });
      expect(useAuthStore.getState().isLoading).toBe(true);

      await promise;
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('stores token and user on successful login', async () => {
      const { http } = await import('@services');
      (http.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          access: 'access_tok',
          expires_in: 900,
          token_type: 'Bearer',
          user: mockUser,
        },
        status: 200,
        message: 'OK',
      });

      await useAuthStore.getState().login({ email_or_username: 'a@b.com', password: 'pw' });

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('access_tok');
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('sets error on failed login and re-throws', async () => {
      const { http } = await import('@services');
      (http.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Invalid credentials'),
      );

      await expect(
        useAuthStore.getState().login({ email_or_username: 'a@b.com', password: 'bad' }),
      ).rejects.toThrow('Invalid credentials');

      const state = useAuthStore.getState();
      expect(state.error).toBe('Invalid credentials');
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // logout
  // -----------------------------------------------------------------------

  describe('logout', () => {
    it('clears auth state after calling BE', async () => {
      const { http } = await import('@services');
      (http.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: null,
        status: 204,
        message: 'No Content',
      });

      useAuthStore.getState().setAuth('tok', mockUser);
      setCsrfToken('csrf');

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.accessToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(getCsrfToken()).toBeNull();
    });

    it('clears state even if the BE call fails', async () => {
      const { http } = await import('@services');
      (http.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error'),
      );

      useAuthStore.getState().setAuth('tok', mockUser);
      await useAuthStore.getState().logout();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // refreshToken
  // -----------------------------------------------------------------------

  describe('refreshToken', () => {
    it('returns true and updates token on success', async () => {
      const { http } = await import('@services');
      (http.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { access: 'new_tok', expires_in: 900, token_type: 'Bearer' },
        status: 200,
        message: 'OK',
      });

      const result = await useAuthStore.getState().refreshToken();

      expect(result).toBe(true);
      expect(useAuthStore.getState().accessToken).toBe('new_tok');
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('returns false and clears auth on failure', async () => {
      const { http } = await import('@services');
      (http.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Refresh expired'),
      );

      useAuthStore.getState().setAuth('old', mockUser);

      const result = await useAuthStore.getState().refreshToken();

      expect(result).toBe(false);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('deduplicates concurrent refresh calls', async () => {
      const { http } = await import('@services');
      (http.post as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { access: 'dedup_tok', expires_in: 900, token_type: 'Bearer' },
        status: 200,
        message: 'OK',
      });

      const [r1, r2, r3] = await Promise.all([
        useAuthStore.getState().refreshToken(),
        useAuthStore.getState().refreshToken(),
        useAuthStore.getState().refreshToken(),
      ]);

      expect(r1).toBe(true);
      expect(r2).toBe(true);
      expect(r3).toBe(true);
      // Only ONE http.post call should have been made
      expect(http.post).toHaveBeenCalledTimes(1);
    });
  });
});
