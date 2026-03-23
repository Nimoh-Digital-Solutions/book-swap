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

/** User profile endpoints. */
const USERS = `${V1}/users` as const;

/** Health-check endpoint. */
const HEALTH = `${V1}/health` as const;

/** Book listing endpoints. */
const BOOKS = `${V1}/books` as const;

/** Wishlist endpoints. */
const WISHLIST = `${V1}/wishlist` as const;

/** Exchange endpoints. */
const EXCHANGES = `${V1}/exchanges` as const;

/** Messaging endpoints. */
const MESSAGING = `${V1}/messaging` as const;

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

  users: {
    me: `${USERS}/me/`,
    meLocation: `${USERS}/me/location/`,
    meOnboardingComplete: `${USERS}/me/onboarding/complete/`,
    meDelete: `${USERS}/me/delete/`,
    meDeleteCancel: `${USERS}/me/delete/cancel/`,
    checkUsername: `${USERS}/check-username/`,
    detail: (id: string) => `${USERS}/${id}/`,
  },

  health: `${HEALTH}/`,

  books: {
    list: `${BOOKS}/`,
    detail: (id: string) => `${BOOKS}/${id}/`,
    create: `${BOOKS}/`,
    isbnLookup: `${BOOKS}/isbn-lookup/`,
    searchExternal: `${BOOKS}/search-external/`,
    photos: (bookId: string) => `${BOOKS}/${bookId}/photos/`,
    photoDetail: (bookId: string, photoId: string) =>
      `${BOOKS}/${bookId}/photos/${photoId}/`,
    photosReorder: (bookId: string) => `${BOOKS}/${bookId}/photos/reorder/`,
  },

  wishlist: {
    list: `${WISHLIST}/`,
    create: `${WISHLIST}/`,
    detail: (id: string) => `${WISHLIST}/${id}/`,
  },

  browse: {
    list: `${BOOKS}/browse/`,
    radiusCounts: `${BOOKS}/browse/radius-counts/`,
    nearbyCount: `${BOOKS}/nearby-count/`,
  },

  exchanges: {
    list: `${EXCHANGES}/`,
    detail: (id: string) => `${EXCHANGES}/${id}/`,
    create: `${EXCHANGES}/`,
    accept: (id: string) => `${EXCHANGES}/${id}/accept/`,
    decline: (id: string) => `${EXCHANGES}/${id}/decline/`,
    counter: (id: string) => `${EXCHANGES}/${id}/counter/`,
    cancel: (id: string) => `${EXCHANGES}/${id}/cancel/`,
    acceptConditions: (id: string) => `${EXCHANGES}/${id}/accept-conditions/`,
    conditions: (id: string) => `${EXCHANGES}/${id}/conditions/`,
    confirmSwap: (id: string) => `${EXCHANGES}/${id}/confirm-swap/`,
    requestReturn: (id: string) => `${EXCHANGES}/${id}/request-return/`,
    confirmReturn: (id: string) => `${EXCHANGES}/${id}/confirm-return/`,
    incoming: `${EXCHANGES}/incoming/`,
    incomingCount: `${EXCHANGES}/incoming/count/`,
  },

  messaging: {
    messages: (exchangeId: string) =>
      `${MESSAGING}/exchanges/${exchangeId}/messages/`,
    markRead: (exchangeId: string) =>
      `${MESSAGING}/exchanges/${exchangeId}/messages/mark-read/`,
    meetupSuggestions: (exchangeId: string) =>
      `${MESSAGING}/exchanges/${exchangeId}/meetup-suggestions/`,
  },
} as const;
