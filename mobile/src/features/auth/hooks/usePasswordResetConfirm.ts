import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';

interface ResetConfirmParams {
  uid: string;
  token: string;
  newPassword: string;
}

export function usePasswordResetConfirm() {
  return useMutation({
    mutationFn: ({ uid, token, newPassword }: ResetConfirmParams) =>
      authApi.passwordResetConfirm(uid, token, newPassword),
  });
}
