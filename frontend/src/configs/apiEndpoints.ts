// ---------------------------------------------------------------------------
// Centralised API endpoint constants
// ---------------------------------------------------------------------------
// Every API path the FE calls should be referenced through this object so
// that endpoint changes propagate from a single location.  Path segments
// that contain resource IDs are exposed as functions.
//
// To add domain-specific endpoints for your project, create a new group:
//
//   const ITEMS = `${V1}/items` as const;
//   // then in the API object:
//   items: {
//     list: `${ITEMS}/`,
//     detail: (id: number) => `${ITEMS}/${id}/`,
//   },
// ---------------------------------------------------------------------------

const V1 = '/api/v1';

/** Auth endpoints — login, register, session management. */
const AUTH = `${V1}/auth` as const;

/** Health-check endpoint. */
const HEALTH = `${V1}/health` as const;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const API = {
  auth: {
    login: `${AUTH}/login/`,
    register: `${AUTH}/register/`,
    logout: `${AUTH}/logout/`,
    refresh: `${AUTH}/token/refresh/`,
    verify: `${AUTH}/token/verify/`,
    csrf: `${AUTH}/csrf/`,
    me: `${AUTH}/me/`,
    emailVerify: `${AUTH}/email/verify/`,
    emailResend: `${AUTH}/email/resend/`,
    passwordReset: `${AUTH}/password/reset/`,
    passwordResetConfirm: `${AUTH}/password/reset/confirm/`,
    passwordChange: `${AUTH}/password/change/`,
    exchangeToken: `${AUTH}/exchange-token/`,
    sessions: {
      list: `${AUTH}/sessions/`,
      detail: (id: string) => `${AUTH}/sessions/${id}/`,
    },
  },

  health: `${HEALTH}/`,
} as const;
