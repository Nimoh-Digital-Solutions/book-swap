/**
 * profile.types.ts
 *
 * Type contracts for the profile feature, aligned with the Django backend
 * serializers: UserPrivateSerializer, UserPublicSerializer, UserUpdateSerializer,
 * SetLocationSerializer, and OnboardingCompleteSerializer.
 */

// ---------------------------------------------------------------------------
// Shared value types
// ---------------------------------------------------------------------------

/** Snapped location returned by the backend (500m grid). */
export interface SnappedLocation {
  latitude: number;
  longitude: number;
}

/** Supported UI languages. */
export type PreferredLanguage = 'en' | 'nl' | 'both';

// ---------------------------------------------------------------------------
// Response shapes (from BE)
// ---------------------------------------------------------------------------

/**
 * Full user profile — returned by `GET /api/v1/users/me/`.
 * Maps to `UserPrivateSerializer` on the backend.
 */
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
}

/**
 * Public user profile — returned by `GET /api/v1/users/:id/`.
 * Maps to `UserPublicSerializer` on the backend.
 */
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

// ---------------------------------------------------------------------------
// Mutation payloads
// ---------------------------------------------------------------------------

/**
 * Payload for `PATCH /api/v1/users/me/`.
 * Maps to `UserUpdateSerializer`. All fields optional (partial update).
 */
export interface UpdateProfilePayload {
  first_name?: string;
  last_name?: string;
  bio?: string;
  avatar?: File | null;
  preferred_genres?: string[];
  preferred_language?: PreferredLanguage;
  preferred_radius?: number;
}

/**
 * Payload for `POST /api/v1/users/me/location/`.
 * Maps to `SetLocationSerializer` — provide postcode OR lat/lng.
 */
export interface SetLocationPayload {
  postcode?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Response from `POST /api/v1/users/me/location/`.
 */
export interface SetLocationResponse {
  location: SnappedLocation;
  neighborhood: string;
}

/**
 * Response from `POST /api/v1/users/me/onboarding/complete/`.
 */
export interface OnboardingCompleteResponse {
  onboarding_completed: boolean;
}
