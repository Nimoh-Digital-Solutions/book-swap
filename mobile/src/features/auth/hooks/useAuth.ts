import { useMutation } from '@tanstack/react-query';
import * as LocalAuthentication from 'expo-local-authentication';
import { http } from '@/services/http';
import { API } from '@/configs/apiEndpoints';
import { useAuthStore } from '@/stores/authStore';
import { tokenStorage } from '@/lib/storage';
import { mergePartialUser } from '@/lib/mergeUser';
import type { LoginResponse, RegisterPayload, User } from '@/types';

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const { data } = await http.post<LoginResponse>(API.auth.login, {
        email_or_username: credentials.email.trim(),
        password: credentials.password,
      });
      return data;
    },
    onSuccess: async (data) => {
      const user = mergePartialUser(data.user as Parameters<typeof mergePartialUser>[0]);
      await setAuth(user, data.access_token, data.refresh_token);
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const { data } = await http.post(API.auth.register, payload);
      return data;
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  return useMutation({
    mutationFn: async () => {
      const refresh = tokenStorage.getRefresh();
      if (refresh) {
        await http.post(API.auth.logout, { refresh });
      }
    },
    onSettled: async () => {
      await logout();
    },
  });
}

export function useMe() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: async () => {
      const { data } = await http.get<User>(API.users.me);
      return data;
    },
    onSuccess: async (data) => {
      await setUser(data);
    },
  });
}

export function useRefreshToken() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: async () => {
      const refresh = tokenStorage.getRefresh();
      if (!refresh) throw new Error('No refresh token');
      const { data } = await http.post<{ access: string; refresh?: string }>(API.auth.refresh, {
        refresh,
      });
      return data;
    },
    onSuccess: async (data) => {
      const refresh = tokenStorage.getRefresh();
      const newRefresh = data.refresh ?? refresh ?? '';
      if (!newRefresh) return;
      if (user) {
        await setAuth(user, data.access, newRefresh);
      } else {
        tokenStorage.setTokens(data.access, newRefresh);
      }
    },
  });
}

/** Hardware + enrollment probe (e.g. show biometric UI). */
export function useBiometricCheck() {
  return useMutation({
    mutationFn: async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = hasHardware ? await LocalAuthentication.isEnrolledAsync() : false;
      return { hasHardware, enrolled, available: hasHardware && enrolled };
    },
  });
}

/** Prompts Face ID / Touch ID / device PIN. */
export function useBiometricAuthenticate() {
  return useMutation({
    mutationFn: async (promptMessage: string) =>
      LocalAuthentication.authenticateAsync({ promptMessage }),
  });
}
