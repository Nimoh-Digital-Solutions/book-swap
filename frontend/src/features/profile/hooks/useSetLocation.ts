/**
 * useSetLocation.ts
 *
 * TanStack Query mutation hook for setting the user's location.
 * Sends `POST /api/v1/users/me/location/` and invalidates the profile cache.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { profileService } from '../services/profile.service';
import type { SetLocationPayload, SetLocationResponse } from '../types/profile.types';
import { profileKeys } from './profileKeys';

/**
 * Set or update the authenticated user's location via postcode or coordinates.
 *
 * @example
 * const setLocation = useSetLocation();
 * setLocation.mutate({ postcode: '1012 AB' });
 * // or
 * setLocation.mutate({ latitude: 52.37, longitude: 4.89 });
 */
export function useSetLocation() {
  const queryClient = useQueryClient();

  return useMutation<SetLocationResponse, Error, SetLocationPayload>({
    mutationFn: (payload) => profileService.setLocation(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: profileKeys.me() });
    },
  });
}
