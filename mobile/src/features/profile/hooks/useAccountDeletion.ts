import { useMutation } from '@tanstack/react-query';
import { http } from '@/services/http';
import { API } from '@/configs/apiEndpoints';
import { deletionStorage } from '@/lib/storage';
import { useAuthStore } from '@/stores/authStore';
import type {
  AccountDeletionPayload,
  AccountDeletionResponse,
  AccountDeletionCancelPayload,
} from '@/types';

export function useDeleteAccount() {
  const logout = useAuthStore((s) => s.logout);

  return useMutation<AccountDeletionResponse, Error, AccountDeletionPayload>({
    mutationFn: async (payload) => {
      const { data } = await http.post<AccountDeletionResponse>(
        API.users.meDelete,
        payload,
      );
      return data;
    },
    onSuccess: async (data) => {
      deletionStorage.setCancelToken(data.cancel_token);
      await logout();
    },
  });
}

export function useCancelDeletion() {
  return useMutation<{ detail: string }, Error, AccountDeletionCancelPayload>({
    mutationFn: async (payload) => {
      const { data } = await http.post<{ detail: string }>(
        API.users.meDeleteCancel,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      deletionStorage.clearCancelToken();
    },
  });
}
