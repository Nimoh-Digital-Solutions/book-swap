/**
 * Profile feature public API
 *
 * Import from '@features/profile' in consuming code — never reach
 * into sub-directories directly from outside this feature.
 *
 * @example
 * import { useProfile, useUpdateProfile, profileService } from '@features/profile';
 */

// Hooks
export { profileKeys } from './hooks/profileKeys';
export { useCompleteOnboarding } from './hooks/useCompleteOnboarding';
export { useProfile } from './hooks/useProfile';
export { usePublicProfile } from './hooks/usePublicProfile';
export { useSetLocation } from './hooks/useSetLocation';
export { useUpdateProfile } from './hooks/useUpdateProfile';

// Pages
export { ProfilePage } from './pages/ProfilePage';

// Schemas
export type {
  LocationFormValues,
  ProfileEditFormValues,
} from './schemas/profile.schemas';
export { locationSchema, profileEditSchema } from './schemas/profile.schemas';

// Service
export { profileService } from './services/profile.service';

// Types
export type {
  OnboardingCompleteResponse,
  PreferredLanguage,
  SetLocationPayload,
  SetLocationResponse,
  SnappedLocation,
  UpdateProfilePayload,
  UserProfile,
  UserPublicProfile,
} from './types/profile.types';
