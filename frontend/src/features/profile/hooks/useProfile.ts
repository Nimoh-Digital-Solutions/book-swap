/**
 * useProfile.ts
 *
 * TanStack Query hook for the authenticated user's own profile.
 * Fetches from `GET /api/v1/users/me/`.
 */
import { API } from '@configs/apiEndpoints';
import { useApiQuery } from '@hooks/useApiQuery';
import type { UseQueryResult } from '@tanstack/react-query';

import type { UserProfile } from '../types/profile.types';
import { profileKeys } from './profileKeys';

/**
 * Fetch the authenticated user's full profile.
 *
 * @param enabled - Pass `false` to disable the query (e.g. when not authenticated).
 *
 * @example
 * const { data: profile, isLoading } = useProfile();
 */
export function useProfile(
  enabled = true,
): UseQueryResult<UserProfile> {
  return useApiQuery<UserProfile>(
    profileKeys.me(),
    API.users.me,
    { enabled },
  );
}
