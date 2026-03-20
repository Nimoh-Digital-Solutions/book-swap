import { API } from '@configs/apiEndpoints';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type {
  AuthActions,
  AuthState,
  AuthUser,
  LoginPayload,
  LoginResponse,
  RefreshResponse,
} from '../types/auth.types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Module-scoped CSRF token
// ---------------------------------------------------------------------------

/**
 * CSRF token fetched from the BE on app init.
 * Stored in module scope (not in Zustand) because it has no reactive
 * consumers — it's only read by the request interceptor.
 */
let csrfToken: string | null = null;

/** Read the current CSRF token (used by the CSRF interceptor). */
export function getCsrfToken(): string | null {
  return csrfToken;
}

/** Update the CSRF token (called during init and after refresh). */
export function setCsrfToken(token: string | null): void {
  csrfToken = token;
}

// ---------------------------------------------------------------------------
// Token-refresh concurrency guard
// ---------------------------------------------------------------------------

/**
 * When multiple 401 responses arrive simultaneously, we must ensure only
 * one refresh request is in-flight. All concurrent callers await the same
 * promise to avoid a thundering-herd effect.
 */
let refreshPromise: Promise<boolean> | null = null;

// ---------------------------------------------------------------------------
// Auth Store
// ---------------------------------------------------------------------------

export type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(devtools((set, get) => ({
  // -- State ----------------------------------------------------------------
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // -- Actions --------------------------------------------------------------

  setAuth: (token: string, user: AuthUser) => {
    localStorage.setItem('tast:sessionActive', '1');
    set({
      accessToken: token,
      user,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
    // Set Sentry user context for error attribution
    void import('@configs/sentry').then(({ setSentryUser }) => {
      setSentryUser({ id: user.id, email: user.email });
    });
  },

  clearAuth: () => {
    localStorage.removeItem('tast:sessionActive');
    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    // Clear Sentry user context on deauth
    void import('@configs/sentry').then(({ setSentryUser }) => {
      setSentryUser(null);
    });
  },

  login: async (credentials: LoginPayload) => {
    set({ isLoading: true, error: null });
    try {
      // Dynamic import to avoid circular dependency:
      // authStore → http → auth interceptor → authStore
      const { http } = await import('@services');

      const { data } = await http.post<LoginResponse>(
        API.auth.login,
        credentials,
      );

      set({
        accessToken: data.access,
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Login failed';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      const { http } = await import('@services');
      await http.post(`${API.auth.logout}`, {});
    } catch (error: unknown) {
      // Log but don't block — we clear state regardless
      const { logger } = await import('@utils/logger');
      logger.warn('[auth] Logout request failed', { error });
    } finally {
      get().clearAuth();
      setCsrfToken(null);
    }
  },

  refreshToken: async () => {
    // Deduplicate concurrent refresh calls
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async (): Promise<boolean> => {
      // Snapshot authenticated state before the request so we can detect
      // if clearAuth was called while the refresh was in-flight.
      const wasAuthenticated = get().isAuthenticated;

      try {
        const { http } = await import('@services');

        // The httpOnly refresh cookie is sent automatically by the browser
        const { data } = await http.post<RefreshResponse>(
          API.auth.refresh,
          {},
        );

        // Guard against a race where logout / clearAuth was called while
        // the refresh request was in-flight. If auth was explicitly cleared
        // during the request, don't re-set authenticated state.
        if (wasAuthenticated && !get().isAuthenticated) {
          return false;
        }

        set({
          accessToken: data.access,
          isAuthenticated: true,
          error: null,
        });

        return true;
      } catch {
        get().clearAuth();
        return false;
      } finally {
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  },
}), { name: 'AuthStore', enabled: import.meta.env.DEV }));
