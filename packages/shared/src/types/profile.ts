export interface SnappedLocation {
  latitude: number;
  longitude: number;
}

export type PreferredLanguage = 'en' | 'nl' | 'both';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  bio: string;
  avatar: string | null;
  location: SnappedLocation | null;
  neighborhood: string;
  preferred_genres: string[];
  preferred_language: PreferredLanguage;
  preferred_radius: number;
  avg_rating: string;
  swap_count: number;
  rating_count: number;
  auth_provider: string;
  onboarding_completed: boolean;
  email_verified: boolean;
  member_since: string;
  profile_public: boolean;
  /** ISO8601 timestamp when the user requested account deletion (US-203). */
  deletion_requested_at: string | null;
}

export interface UserPublicProfile {
  id: string;
  username: string;
  first_name: string;
  bio: string;
  avatar: string | null;
  location: SnappedLocation | null;
  neighborhood: string;
  preferred_genres: string[];
  preferred_language: PreferredLanguage;
  avg_rating: string;
  swap_count: number;
  rating_count: number;
  member_since: string;
}

export interface UpdateProfilePayload {
  first_name?: string | undefined;
  last_name?: string | undefined;
  bio?: string | undefined;
  avatar?: File | null | undefined;
  preferred_genres?: string[] | undefined;
  preferred_language?: PreferredLanguage | undefined;
  preferred_radius?: number | undefined;
  profile_public?: boolean | undefined;
}

export interface SetLocationPayload {
  postcode?: string | undefined;
  latitude?: number | undefined;
  longitude?: number | undefined;
}

export interface SetLocationResponse {
  location: SnappedLocation;
  neighborhood: string;
}

export interface OnboardingCompleteResponse {
  onboarding_completed: boolean;
}

export interface CheckUsernameResponse {
  available: boolean;
  suggestions?: string[] | undefined;
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
