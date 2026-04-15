/** Paths relative to `env.apiUrl` (includes `/api/v1`). */
const AUTH = '/auth' as const;
const USERS = '/users' as const;
const HEALTH = '/health' as const;
const BOOKS = '/books' as const;
const WISHLIST = '/wishlist' as const;
const EXCHANGES = '/exchanges' as const;
const MESSAGING = '/messaging' as const;
const RATINGS = '/ratings' as const;

export const API = {
  auth: {
    login: `${AUTH}/login/`,
    register: `${AUTH}/register/`,
    logout: `${AUTH}/logout/`,
    refresh: `${AUTH}/token/refresh/`,
    verify: `${AUTH}/token/verify/`,
    emailVerify: `${AUTH}/email/verify/`,
    emailResend: `${AUTH}/email/resend/`,
    passwordReset: `${AUTH}/password/reset/`,
    passwordResetConfirm: `${AUTH}/password/reset/confirm/`,
    passwordChange: `${AUTH}/password/change/`,
    exchangeToken: `${AUTH}/exchange-token/`,
    socialLoginStart: (backend: string) => `${AUTH}/social/login/${backend}/`,
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
  ratings: {
    exchangeStatus: (exchangeId: string) =>
      `${RATINGS}/exchanges/${exchangeId}/`,
    exchangeSubmit: (exchangeId: string) =>
      `${RATINGS}/exchanges/${exchangeId}/`,
    userRatings: (userId: string) => `${RATINGS}/users/${userId}/`,
  },
  blocks: {
    list: `${USERS}/block/`,
    create: `${USERS}/block/`,
    delete: (userId: string) => `${USERS}/block/${userId}/`,
  },
  reports: {
    create: '/reports/',
  },
  notifications: {
    list: '/notifications/',
    markRead: (id: string) => `/notifications/${id}/read/`,
    markAllRead: '/notifications/mark-all-read/',
    preferences: '/notifications/preferences/',
  },
} as const;
