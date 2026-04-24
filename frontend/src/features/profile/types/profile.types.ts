/**
 * profile.types.ts
 *
 * Re-exports from `@shared` — see `packages/shared/src/types/profile.ts`
 * for the canonical contracts (the BookSwap source of truth shared with the
 * mobile app).
 */

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
} from '@shared/types/profile';
