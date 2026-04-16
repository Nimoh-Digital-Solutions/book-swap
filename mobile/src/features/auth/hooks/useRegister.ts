import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import type { RegisterInput } from '../schemas/auth.schemas';

export function useRegister() {
  return useMutation({
    mutationFn: (input: RegisterInput) =>
      authApi.register({
        email: input.email,
        username: input.username,
        password: input.password,
        password_confirm: input.password_confirm,
        first_name: input.first_name,
        last_name: input.last_name,
      }),
  });
}
