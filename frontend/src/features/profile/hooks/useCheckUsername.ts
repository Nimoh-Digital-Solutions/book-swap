/**
 * useCheckUsername.ts
 *
 * Debounced TanStack Query hook for checking username availability.
 * Fetches from `GET /api/v1/users/check-username/?q=<name>`.
 */
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

import { profileService } from '../services/profile.service';
import type { CheckUsernameResponse } from '../types/profile.types';
import { profileKeys } from './profileKeys';

/**
 * Check if a username is available with 300ms debounce.
 *
 * @param username - The username to check. Query is disabled when empty or < 3 chars.
 * @param currentUsername - The current user's username (excluded from check).
 *
 * @example
 * const { data, isLoading } = useCheckUsername(inputValue, profile.username);
 * if (data && !data.available) showError('Username taken');
 */
export function useCheckUsername(
  username: string,
  currentUsername?: string,
) {
  const [debouncedValue, setDebouncedValue] = useState(username);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(username), 300);
    return () => clearTimeout(timer);
  }, [username]);

  const trimmed = debouncedValue.trim().toLowerCase();
  const isOwnUsername = currentUsername?.toLowerCase() === trimmed;
  const enabled = trimmed.length >= 3 && !isOwnUsername;

  return useQuery<CheckUsernameResponse>({
    queryKey: profileKeys.checkUsername(trimmed),
    queryFn: () => profileService.checkUsername(trimmed),
    enabled,
    staleTime: 30_000,
  });
}
