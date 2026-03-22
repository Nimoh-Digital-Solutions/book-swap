/**
 * Profile feature public API
 *
 * Import from '@features/profile' in consuming code — never reach
 * into sub-directories directly from outside this feature.
 *
 * @example
 * import { useProfile, useUpdateProfile, profileService } from '@features/profile';
 */

// Components
export { AvatarUpload } from './components/AvatarUpload';
export { DeleteAccountDialog } from './components/DeleteAccountDialog';
export { EditProfileForm } from './components/EditProfileForm';
export { GenrePicker } from './components/GenrePicker';
export { NewMemberBadge } from './components/NewMemberBadge';

// Hooks
export { profileKeys } from './hooks/profileKeys';
export { useCheckUsername } from './hooks/useCheckUsername';
export { useCompleteOnboarding } from './hooks/useCompleteOnboarding';
export { useDeleteAccount } from './hooks/useDeleteAccount';
export { useProfile } from './hooks/useProfile';
export { usePublicProfile } from './hooks/usePublicProfile';
export { useSetLocation } from './hooks/useSetLocation';
export { useUpdateProfile } from './hooks/useUpdateProfile';

// Pages
export { EditProfilePage } from './pages/EditProfilePage';
export { ProfilePage } from './pages/ProfilePage';
export { PublicProfilePage } from './pages/PublicProfilePage';

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
  AccountDeletionCancelPayload,
  AccountDeletionPayload,
  AccountDeletionResponse,
  CheckUsernameResponse,
  OnboardingCompleteResponse,
  PreferredLanguage,
  SetLocationPayload,
  SetLocationResponse,
  SnappedLocation,
  UpdateProfilePayload,
  UserProfile,
  UserPublicProfile,
} from './types/profile.types';
