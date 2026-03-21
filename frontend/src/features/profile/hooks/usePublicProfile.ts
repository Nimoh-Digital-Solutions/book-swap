/**
 * usePublicProfile.ts
 *
 * TanStack Query hook for another user's public profile.
 * Fetches from `GET /api/v1/users/:id/`.
 */
import { API } from '@configs/apiEndpoints';
import { useApiQuery } from '@hooks/useApiQuery';
import type { UseQueryResult } from '@tanstack/react-query';

import type { UserPublicProfile } from '../types/profile.types';
import { profileKeys } from './profileKeys';

/**
 * Fetch a user's public profile by UUID.
 *
 * @param id - The user's UUID. Query is disabled when `id` is falsy.
 *
 * @example
 * const { data: profile } = usePublicProfile(userId);
 */
export function usePublicProfile(
  id: string | undefined,
): UseQueryResult<UserPublicProfile> {
  return useApiQuery<UserPublicProfile>(
    profileKeys.detail(id ?? ''),
    API.users.detail(id ?? ''),
    { enabled: !!id },
  );
}
