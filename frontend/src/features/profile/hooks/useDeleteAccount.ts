/**
 * useDeleteAccount.ts
 *
 * TanStack Query mutation hook for requesting account deletion.
 * Sends `POST /api/v1/users/me/delete/` with password confirmation.
 */
import { useMutation } from '@tanstack/react-query';

import { profileService } from '../services/profile.service';
import type {
  AccountDeletionPayload,
  AccountDeletionResponse,
} from '../types/profile.types';

/**
 * Request account deletion (GDPR US-203).
 * On success the account is deactivated with a 30-day grace period.
 *
 * @example
 * const deleteAccount = useDeleteAccount();
 * deleteAccount.mutate({ password: '...' });
 */
export function useDeleteAccount() {
  return useMutation<AccountDeletionResponse, Error, AccountDeletionPayload>({
    mutationFn: (payload) => profileService.requestDeletion(payload),
  });
}
