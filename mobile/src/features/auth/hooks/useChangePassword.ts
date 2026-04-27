import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';

interface ChangePasswordInput {
  old_password: string;
  new_password1: string;
  new_password2: string;
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) => authApi.changePassword(input),
  });
}
