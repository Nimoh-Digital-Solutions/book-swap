/**
 * useCompleteOnboarding.ts
 *
 * TanStack Query mutation hook for marking onboarding as complete.
 * Sends `POST /api/v1/users/me/onboarding/complete/` and updates the profile cache.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { profileService } from '../services/profile.service';
import type { OnboardingCompleteResponse } from '../types/profile.types';
import { profileKeys } from './profileKeys';

/**
 * Mark the authenticated user's onboarding as complete.
 * Requires that the user's location is already set.
 *
 * @example
 * const completeOnboarding = useCompleteOnboarding();
 * completeOnboarding.mutate();
 */
export function useCompleteOnboarding() {
  const queryClient = useQueryClient();

  return useMutation<OnboardingCompleteResponse, Error, void>({
    mutationFn: () => profileService.completeOnboarding(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: profileKeys.me() });
    },
  });
}
