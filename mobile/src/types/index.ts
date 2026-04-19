// ---------------------------------------------------------------------------
// Re-exports from @bookswap/shared (source of truth for web + mobile)
// ---------------------------------------------------------------------------

// Exchange types — identical across platforms
export type {
  ExchangeStatus,
  ExchangeParticipant,
  ExchangeBook,
  ExchangeListItem,
  CreateExchangePayload,
  CounterProposePayload,
  DeclinePayload,
} from '@shared/types/exchange';

// Notification types
export type {
  NotificationType,
  Notification,
  NotificationPreferences,
  PatchNotificationPreferences,
} from '@shared/types/notification';

// Trust & Safety types
export type {
  ReportCategory,
  BlockedUser,
  Block,
  CreateReportPayload,
} from '@shared/types/trust-safety';

// Profile types — account deletion payloads
export type {
  AccountDeletionPayload,
  AccountDeletionResponse,
  AccountDeletionCancelPayload,
} from '@shared/types/profile';

// Rating — submit payload
export type { SubmitRatingPayload } from '@shared/types/rating';

// ---------------------------------------------------------------------------
// Mobile-specific types (diverged from shared or mobile-only)
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  bio: string;
  avatar: string | null;
  location: { type: 'Point'; coordinates: [number, number] } | null;
  neighborhood: string;
  preferred_genres: string[];
  preferred_language: string;
  preferred_radius: number;
  avg_rating: number;
  swap_count: number;
  rating_count: number;
  profile_public: boolean;
  onboarding_completed: boolean;
  email_verified: boolean;
  auth_provider: string;
  created_at: string;
}

export interface Book {
  id: string;
  owner: string;
  title: string;
  author: string;
  isbn: string;
  description: string;
  condition: BookCondition;
  genre: string;
  language: string;
  status: string;
  cover_url?: string | null;
  primary_photo?: string | null;
  photos: BookPhoto[];
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export type BookCondition = 'new' | 'like_new' | 'good' | 'fair' | 'poor';

export interface BookPhoto {
  id: string;
  image: string;
  order: number;
}

export type DeclineReason = 'not_interested' | 'reserved' | 'counter_proposed' | 'other';

export interface ExchangeDetail extends import('@shared/types/exchange').ExchangeListItem {
  decline_reason: DeclineReason | null;
  counter_to: string | null;
  original_offered_book: import('@shared/types/exchange').ExchangeBook | null;
  last_counter_by: string | null;
  counter_approved_at: string | null;
  requester_confirmed_at: string | null;
  owner_confirmed_at: string | null;
  return_requested_at: string | null;
  return_confirmed_requester: string | null;
  return_confirmed_owner: string | null;
  expired_at: string | null;
  conditions_accepted_by_me: boolean;
  conditions_accepted_count: number;
  conditions_version: string;
}

/** @deprecated Use ExchangeListItem or ExchangeDetail instead */
export type ExchangeRequest = import('@shared/types/exchange').ExchangeListItem;

export interface Message {
  id: string;
  exchange: string;
  sender: User;
  content: string;
  image: string | null;
  read_at: string | null;
  created_at: string;
}

export interface RatingUser {
  id: string;
  username: string;
  avatar: string | null;
}

export interface Rating {
  id: string;
  exchange: string;
  rater: RatingUser;
  rated: RatingUser;
  score: number;
  comment: string;
  created_at: string;
}

export interface ExchangeRatingStatus {
  exchange_id: string;
  my_rating: Rating | null;
  partner_rating: Rating | null;
  can_rate: boolean;
  rating_deadline: string;
}

export interface PaginatedRatings {
  count: number;
  next: string | null;
  previous: string | null;
  results: Rating[];
}

export interface WishlistItem {
  id: string;
  book_id: string | null;
  title: string;
  author: string;
  isbn: string;
  genre: string;
  cover_url: string;
  created_at: string;
}

export interface CreateWishlistPayload {
  book?: string;
  title?: string;
  author?: string;
  isbn?: string;
  genre?: string;
  cover_url?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: User;
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface LocationPayload {
  latitude: number;
  longitude: number;
  neighborhood?: string;
}

export interface UserPublicProfile {
  id: string;
  username: string;
  first_name: string;
  bio: string;
  avatar: string | null;
  neighborhood: string;
  preferred_genres: string[];
  preferred_language: string;
  avg_rating: number;
  swap_count: number;
  rating_count: number;
  member_since: string;
}

export interface SocialAuthResponse extends LoginResponse {}

export interface AppleSignInUser {
  email?: string;
  first_name?: string;
  last_name?: string;
}

export interface MeetupLocation {
  id: string;
  name: string;
  address: string;
  category: string;
  location: { type: 'Point'; coordinates: [number, number] };
  city: string;
}
