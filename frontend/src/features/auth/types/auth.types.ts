/**
 * auth.types.ts
 *
 * Shared type contracts for the auth feature.
 * These are used by the auth store, service layer, hooks, and form schemas.
 *
 * Types are aligned with the nimoh_base Django/DRF backend patterns:
 * - Login response: `{ access, expires_in, token_type, user }`
 * - Refresh handled via httpOnly cookie (browser-managed)
 * - CSRF token fetched from `GET /api/v1/auth/csrf/`
 * - User IDs are UUIDs (string)
 */

// ---------------------------------------------------------------------------
// Payloads
// ---------------------------------------------------------------------------

/** Payload sent to `POST /api/v1/auth/login/`. */
export interface LoginPayload {
  /** Accepts either email or username — nimoh_base supports both. */
  email_or_username: string;
  password: string;
}

/** Payload sent to `POST /api/v1/auth/register/`. */
export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  /** Must match `password` — nimoh_base validates match server-side. */
  password_confirm: string;
  first_name: string;
  last_name: string;
  /** Optional display name. */
  display_name?: string;
  /** Date of birth for 16+ age gate. Format: YYYY-MM-DD. */
  date_of_birth: string;
  /** User must accept privacy policy before registration. */
  privacy_policy_accepted: boolean;
  /** User must accept terms of service before registration. */
  terms_of_service_accepted: boolean;
}

// ---------------------------------------------------------------------------
// Response shapes (from BE)
// ---------------------------------------------------------------------------

/** User object returned by the BE in auth responses. */
export interface AuthUser {
  /** UUID string — nimoh_base uses UUID primary keys. */
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  /** Username may be present depending on BE configuration. */
  username?: string;
  /** Whether the user's email has been verified. */
  email_verified?: boolean;
}

/**
 * Successful login response from `POST /api/v1/auth/login/`.
 * The refresh token is set as an httpOnly cookie by the BE — not in the body.
 */
export interface LoginResponse {
  /** JWT access token. nimoh_base returns this as `access`. */
  access: string;
  expires_in: number;
  token_type: string;
  user: AuthUser;
}

/** Response from `POST /api/v1/auth/token/refresh/`. */
export interface RefreshResponse {
  /** JWT access token. nimoh_base returns this as `access`. */
  access: string;
  expires_in: number;
  token_type: string;
}

/** Response from `GET /api/v1/auth/csrf/`. */
export interface CsrfResponse {
  /** CSRF token — BE may return as `csrfToken` (camelCase) or `csrf_token` (snake_case). */
  csrfToken?: string;
  csrf_token?: string;
}

// ---------------------------------------------------------------------------
// Store types
// ---------------------------------------------------------------------------

/** The shape of the Zustand auth store state (data only, no actions). */
export interface AuthState {
  /** JWT access token — held in memory only, never persisted to storage. */
  accessToken: string | null;
  /** Authenticated user profile. */
  user: AuthUser | null;
  /** Derived from `accessToken !== null`. */
  isAuthenticated: boolean;
  /** True while an auth operation (login, refresh, logout) is in progress. */
  isLoading: boolean;
  /** Human-readable error message from the last failed auth operation. */
  error: string | null;
}

/** Actions exposed by the Zustand auth store. */
export interface AuthActions {
  /** Authenticate with credentials. Stores token in memory, user in store. */
  login: (credentials: LoginPayload) => Promise<void>;
  /** Invalidate session on BE and clear local state. */
  logout: () => Promise<void>;
  /** Attempt a silent token refresh using the httpOnly cookie. Returns success. */
  refreshToken: () => Promise<boolean>;
  /** Directly set auth state (used by interceptors and init flow). */
  setAuth: (token: string, user: AuthUser) => void;
  /** Clear all auth state and redirect to login. */
  clearAuth: () => void;
}
