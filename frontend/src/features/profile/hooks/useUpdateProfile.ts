/**
 * useUpdateProfile.ts
 *
 * TanStack Query mutation hook for updating the authenticated user's profile.
 * Sends `PATCH /api/v1/users/me/` and invalidates the profile cache on success.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { profileService } from '../services/profile.service';
import type { UpdateProfilePayload, UserProfile } from '../types/profile.types';
import { profileKeys } from './profileKeys';

/**
 * Partially update the authenticated user's profile.
 *
 * @example
 * const updateProfile = useUpdateProfile();
 * updateProfile.mutate({ bio: 'Book lover from Amsterdam' });
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation<UserProfile, Error, UpdateProfilePayload>({
    mutationFn: (payload) => profileService.updateMe(payload),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.me(), updatedProfile);
    },
  });
}
