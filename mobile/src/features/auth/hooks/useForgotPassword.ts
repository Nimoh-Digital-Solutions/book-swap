import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import type { ForgotPasswordInput } from '../schemas/auth.schemas';

export function useForgotPassword() {
  return useMutation({
    mutationFn: (input: ForgotPasswordInput) => authApi.forgotPassword(input.email),
  });
}
