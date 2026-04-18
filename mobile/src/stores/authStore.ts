import { create } from 'zustand';
import type { User } from '@/types';
import { tokenStorage, asyncQueryStorage } from '@/lib/storage';
import { queryClient } from '@/lib/queryClient';
import { setSentryUser } from '@/lib/sentry';
import { authApi } from '@/features/auth/api/auth.api';

const USER_JSON_KEY = 'bookswap_user_json';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  setUser: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  clearAuth: () => Promise<void>;
  setHydrated: () => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  isHydrated: false,

  setAuth: async (user, accessToken, refreshToken) => {
    tokenStorage.setTokens(accessToken, refreshToken);
    await asyncQueryStorage.setItem(USER_JSON_KEY, JSON.stringify(user));
    setSentryUser(user.id);
    set({ user, isAuthenticated: true });
  },

  setUser: async (user) => {
    setSentryUser(user.id);
    await asyncQueryStorage.setItem(USER_JSON_KEY, JSON.stringify(user));
    set({ user });
  },

  logout: async () => {
    tokenStorage.clearAll();
    await asyncQueryStorage.removeItem(USER_JSON_KEY);
    queryClient.clear();
    setSentryUser(null);
    set({ user: null, isAuthenticated: false });
  },

  clearAuth: async () => {
    await get().logout();
  },

  setHydrated: () => set({ isHydrated: true }),

  hydrate: async () => {
    try {
      const access = tokenStorage.getAccess();
      const refresh = tokenStorage.getRefresh();
      const userJson = await asyncQueryStorage.getItem(USER_JSON_KEY);
      let user: User | null = null;
      if (userJson) {
        try {
          user = JSON.parse(userJson) as User;
        } catch {
          user = null;
        }
      }
      const authed = !!(access && refresh);

      if (authed && !user) {
        try {
          user = await authApi.getMe();
          if (user) {
            await asyncQueryStorage.setItem(USER_JSON_KEY, JSON.stringify(user));
          }
        } catch {
          tokenStorage.clearAll();
          await asyncQueryStorage.removeItem(USER_JSON_KEY);
          setSentryUser(null);
          set({ user: null, isAuthenticated: false, isHydrated: true });
          return;
        }
      }

      if (user) setSentryUser(user.id);
      else if (!authed) setSentryUser(null);

      set({
        user: authed ? user : null,
        isAuthenticated: authed,
        isHydrated: true,
      });
    } catch {
      setSentryUser(null);
      set({
        user: null,
        isAuthenticated: false,
        isHydrated: true,
      });
    }
  },
}));
