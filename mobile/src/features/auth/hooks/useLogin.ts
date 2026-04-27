import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '../api/auth.api';
import { mergePartialUser } from '@/lib/mergeUser';
import type { LoginInput } from '../schemas/auth.schemas';

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: async (data) => {
      await setAuth(
        mergePartialUser(data.user as Parameters<typeof mergePartialUser>[0]),
        data.access_token,
        data.refresh_token,
      );
      try {
        const fullUser = await authApi.getMe();
        await setUser(fullUser);
      } catch {
        // Login succeeded; getMe can be retried later
      }
    },
  });
}
