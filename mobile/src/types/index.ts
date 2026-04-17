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

export type ExchangeStatus =
  | 'pending'
  | 'accepted'
  | 'conditions_pending'
  | 'active'
  | 'swap_confirmed'
  | 'completed'
  | 'declined'
  | 'cancelled'
  | 'expired'
  | 'return_requested'
  | 'returned';

export type DeclineReason = 'not_interested' | 'reserved' | 'counter_proposed' | 'other';

export interface ExchangeParticipant {
  id: string;
  username: string;
  avatar: string | null;
  avg_rating: number | null;
  swap_count: number;
}

export interface ExchangeBook {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  condition: string;
  primary_photo: string | null;
}

export interface ExchangeListItem {
  id: string;
  status: ExchangeStatus;
  message: string;
  requester: ExchangeParticipant;
  owner: ExchangeParticipant;
  requested_book: ExchangeBook;
  offered_book: ExchangeBook;
  created_at: string;
  updated_at: string;
}

export interface ExchangeDetail extends ExchangeListItem {
  decline_reason: DeclineReason | null;
  counter_to: string | null;
  original_offered_book: ExchangeBook | null;
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

export interface CreateExchangePayload {
  requested_book_id: string;
  offered_book_id: string;
  message?: string;
}

export interface CounterProposePayload {
  offered_book_id: string;
}

export interface DeclinePayload {
  reason?: DeclineReason;
}

/** @deprecated Use ExchangeListItem or ExchangeDetail instead */
export type ExchangeRequest = ExchangeListItem;

export interface Message {
  id: string;
  exchange: string;
  sender: User;
  content: string;
  image: string | null;
  read_at: string | null;
  created_at: string;
}

export type NotificationType =
  | 'new_request'
  | 'request_accepted'
  | 'request_declined'
  | 'request_expired'
  | 'exchange_completed'
  | 'new_message'
  | 'rating_received';

export interface Notification {
  id: string;
  notification_type: NotificationType;
  title: string;
  body: string;
  link: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationPreferences {
  email_new_request: boolean;
  email_request_accepted: boolean;
  email_request_declined: boolean;
  email_new_message: boolean;
  email_exchange_completed: boolean;
  email_rating_received: boolean;
}

export type PatchNotificationPreferences = Partial<NotificationPreferences>;

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

export interface SubmitRatingPayload {
  score: number;
  comment?: string;
}

export interface PaginatedRatings {
  count: number;
  next: string | null;
  previous: string | null;
  results: Rating[];
}

export interface BlockedUser {
  id: string;
  username: string;
  first_name: string;
  avatar: string | null;
}

export interface Block {
  id: string;
  blocked_user: BlockedUser;
  created_at: string;
}

export type ReportCategory =
  | 'inappropriate'
  | 'fake_listing'
  | 'no_show'
  | 'misrepresented'
  | 'harassment'
  | 'spam'
  | 'other';

export interface CreateReportPayload {
  reported_user_id: string;
  reported_book_id?: string;
  reported_exchange_id?: string;
  category: ReportCategory;
  description?: string;
}

export interface AccountDeletionPayload {
  password: string;
}

export interface AccountDeletionResponse {
  detail: string;
  cancel_token: string;
}

export interface AccountDeletionCancelPayload {
  token: string;
}

export interface WishlistItem {
  id: string;
  title: string;
  author: string;
  isbn: string;
  genre: string;
  cover_url: string;
  created_at: string;
}

export interface CreateWishlistPayload {
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
