import { API } from '@configs/apiEndpoints';
import { http } from '@services';

import type {
  AuthUser,
  CsrfResponse,
  ExchangeTokenResponse,
  LoginPayload,
  LoginResponse,
  RefreshResponse,
  RegisterPayload,
} from '../types/auth.types';

/**
 * API base path for auth endpoints.
 * All auth endpoints live under `/api/v1/auth/`.
 */

/**
 * authService
 *
 * Thin wrappers around the HTTP client for auth-related endpoints.
 * These are consumed by the Zustand auth store and the useInitAuth hook.
 *
 * Token refresh works via an httpOnly cookie set by the BE — the browser
 * sends it automatically with `credentials: 'include'`.
 */
export const authService = {
  /**
   * Log in with credentials (email or username + password).
   * Returns `{ access, expires_in, token_type, user }`.
   * The BE also sets an httpOnly refresh cookie on the response.
   */
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await http.post<LoginResponse>(
      API.auth.login,
      payload,
    );
    return data;
  },

  /**
   * Register a new account.
   * Returns the created user profile.
   */
  async register(payload: RegisterPayload): Promise<{ user: AuthUser }> {
    const { data } = await http.post<{ user: AuthUser }>(
      API.auth.register,
      payload,
    );
    return data;
  },

  /**
   * Invalidate the current session on the server.
   * The BE clears the httpOnly refresh cookie.
   */
  async logout(): Promise<void> {
    await http.post(API.auth.logout, {});
  },

  /**
   * Attempt a silent token refresh using the httpOnly cookie.
   * Returns a new access token on success.
   */
  async refreshToken(): Promise<RefreshResponse> {
    const { data } = await http.post<RefreshResponse>(
      API.auth.refresh,
      {},
    );
    return data;
  },

  /**
   * Fetch a CSRF token from the BE. Must be called before any mutating
   * request so the `X-CSRFToken` header can be attached by the CSRF
   * interceptor.
   */
  async fetchCsrfToken(): Promise<string> {
    const { data } = await http.get<CsrfResponse>(API.auth.csrf);
    // The BE may return the token under either key
    const token = data.csrfToken ?? data.csrf_token;
    if (!token) throw new Error('CSRF response missing token');
    return token;
  },

  /**
   * Fetch the current user profile.
   * Used during session restore after a successful token refresh.
   */
  async getProfile(): Promise<AuthUser> {
    const { data } = await http.get<AuthUser>(API.users.me);
    return data;
  },

  /**
   * Request a password-reset email for the given address.
   */
  async requestPasswordReset(email: string): Promise<void> {
    await http.post(API.auth.passwordReset, { email });
  },

  /**
   * Confirm a password reset using the uid/token from the email link.
   */
  async confirmPasswordReset(
    uid: string,
    token: string,
    newPassword: string,
  ): Promise<void> {
    await http.post(API.auth.passwordResetConfirm, {
      uid,
      token,
      new_password: newPassword,
      new_password_confirm: newPassword,
    });
  },

  /**
   * Exchange a one-time social-auth token (from the PSA pipeline) for a
   * short-lived access_token. Caller must subsequently fetch /me to hydrate
   * the full user object.
   */
  async exchangeSocialToken(exchangeToken: string): Promise<ExchangeTokenResponse> {
    const { data } = await http.post<ExchangeTokenResponse>(API.auth.exchangeToken, {
      exchange_token: exchangeToken,
    });
    return data;
  },
};
