// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// Book
export type {
  BookCondition, BookStatus, BookLanguage, BookOwner, BookPhoto,
  BookListItem, Book, BookMetadata, PaginatedBooks,
  CreateBookPayload, UpdateBookPayload,
  WishlistItem, PaginatedWishlist, BookListFilters,
} from './types/book';

// Exchange
export type {
  ExchangeStatus, DeclineReason,
  ExchangeParticipant, ExchangeBook, ConditionsAcceptanceItem,
  ExchangeListItem, ExchangeDetail, PaginatedExchanges,
  ConditionsStatus, IncomingCount,
  CreateExchangePayload, CounterProposePayload, DeclinePayload,
} from './types/exchange';

// Notification
export type {
  NotificationType, Notification, NotificationListResponse,
  MarkReadResponse, NotificationPreferences, PatchNotificationPreferences,
  NotificationPushEvent,
} from './types/notification';

// Messaging
export type {
  MessageSender, ChatMessage, PaginatedMessages, MeetupCategory, MeetupLocation,
  WsChatMessage, WsChatTyping, WsChatRead, WsChatLocked, WsChatError,
  ChatWsMessage, WsSendMessage, WsSendTyping, WsSendRead, ChatWsOutbound,
} from './types/messaging';

// Profile
export type {
  SnappedLocation, PreferredLanguage,
  UserProfile, UserPublicProfile,
  UpdateProfilePayload, SetLocationPayload, SetLocationResponse,
  OnboardingCompleteResponse, CheckUsernameResponse,
  AccountDeletionPayload, AccountDeletionResponse, AccountDeletionCancelPayload,
} from './types/profile';

// Trust & Safety
export type {
  ReportCategory, ReportStatus,
  BlockedUser, Block, PaginatedBlocks, Report,
  BlockUserPayload, CreateReportPayload, DataExportResponse,
} from './types/trust-safety';

// Discovery
export type {
  OwnerLocation, BrowseBookOwner, BrowseBook, PaginatedBrowseBooks,
  RadiusCounts, NearbyCount, BrowseOrdering, BrowseFilters,
} from './types/discovery';

// Rating
export type {
  Rating, PaginatedRatings, ExchangeRatingStatus, SubmitRatingPayload,
} from './types/rating';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

// Book
export {
  bookConditionSchema, bookStatusSchema, bookLanguageSchema,
  bookOwnerSchema, bookPhotoSchema, bookListItemSchema,
  bookDetailSchema, paginatedBooksSchema,
} from './schemas/book.schema';
export type {
  BookListItemParsed, BookDetailParsed, PaginatedBooksParsed,
} from './schemas/book.schema';

// Exchange
export {
  exchangeStatusSchema, declineReasonSchema,
  exchangeListItemSchema, exchangeDetailSchema, paginatedExchangesSchema,
} from './schemas/exchange.schema';
export type {
  ExchangeListItemParsed, ExchangeDetailParsed, PaginatedExchangesParsed,
} from './schemas/exchange.schema';

// Notification
export {
  notificationTypeSchema, notificationSchema,
  notificationListResponseSchema, notificationPreferencesSchema,
} from './schemas/notification.schema';
export type {
  NotificationParsed, NotificationListResponseParsed, NotificationPreferencesParsed,
} from './schemas/notification.schema';

// Rating
export { submitRatingSchema } from './schemas/rating.schema';
export type { SubmitRatingFormValues } from './schemas/rating.schema';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export {
  BOOK_CONDITIONS, BOOK_STATUSES, BOOK_LANGUAGES,
  BOOK_CONDITION_LABELS, BOOK_LANGUAGE_LABELS,
} from './constants/books';

export {
  EXCHANGE_STATUSES, ACTIVE_STATUSES, PENDING_STATUSES, HISTORY_STATUSES,
  DECLINE_REASONS,
} from './constants/exchanges';

export { NOTIFICATION_TYPES } from './constants/notifications';

export { REPORT_CATEGORIES, REPORT_STATUSES } from './constants/trust-safety';

export { SUPPORTED_LANGUAGES, LANGUAGE_LABELS } from './constants/i18n';
export type { SupportedLanguage } from './constants/i18n';

export { MEETUP_CATEGORIES, MEETUP_CATEGORY_LABELS } from './constants/meetup';
