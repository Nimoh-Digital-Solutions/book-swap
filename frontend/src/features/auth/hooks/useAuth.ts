import { useAuthStore } from '../stores/authStore';
import type { AuthActions,AuthState } from '../types/auth.types';

/**
 * useAuth
 *
 * Convenience hook that exposes the Zustand auth store's state and actions.
 * Components should prefer this over importing `useAuthStore` directly so
 * the coupling to Zustand's selector API stays in one place.
 *
 * @example
 * const { isAuthenticated, user, login, logout } = useAuth();
 */
export function useAuth(): AuthState & AuthActions {
  return useAuthStore();
}
