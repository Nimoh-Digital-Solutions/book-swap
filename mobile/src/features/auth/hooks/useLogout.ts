import { useMutation } from '@tanstack/react-query';
import { tokenStorage } from '@/lib/storage';
import { removePushTokenFromBackend } from '@/services/pushNotifications';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '../api/auth.api';

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);

  return useMutation({
    mutationFn: async () => {
      await removePushTokenFromBackend().catch(() => {});
      const refresh = tokenStorage.getRefresh();
      if (refresh) await authApi.logout(refresh);
    },
    onSettled: () => void logout(),
  });
}
