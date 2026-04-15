import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

import { API } from '@configs/apiEndpoints';
import { useLocaleNavigate } from '@hooks/useLocaleNavigate';
import { PATHS } from '@routes/config/paths';
import { http } from '@services';

import { authService } from '../services/auth.service';
import { useAuthStore } from '../stores/authStore';
import type { AuthUser } from '../types/auth.types';

/**
 * SocialAuthCallbackPage — /auth/verified
 *
 * Landing page after a successful PSA (social-auth-app-django) OAuth dance.
 * The backend redirects here with ?exchange_token=<one-time-token>.
 *
 * Two-step hydration:
 *   1. POST exchange_token → { access_token }
 *   2. GET /users/me with explicit Bearer header → full AuthUser
 *   3. Hydrate Zustand store via setAuth(), navigate home
 */
export function SocialAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useLocaleNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const hasFired = useRef(false);

  useEffect(() => {
    // Guard against React StrictMode double-invocation
    if (hasFired.current) return;
    hasFired.current = true;

    const exchangeToken = searchParams.get('exchange_token');
    if (!exchangeToken) {
      void navigate(PATHS.SOCIAL_AUTH_ERROR, { replace: true });
      return;
    }

    authService
      .exchangeSocialToken(exchangeToken)
      .then(async tokenData => {
        // Fetch the full user profile — the store doesn't have the token yet
        // so we pass the Bearer header explicitly.
        const { data: user } = await http.get<AuthUser>(API.users.me, {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        setAuth(tokenData.access_token, user);
        void navigate(PATHS.HOME, { replace: true });
      })
      .catch(() => {
        void navigate(PATHS.SOCIAL_AUTH_ERROR, { replace: true });
      });
  }, [searchParams, navigate, setAuth]);

  return (
    <main
      className="min-h-screen bg-background-dark flex items-center justify-center"
      aria-live="polite"
      aria-label="Completing sign-in"
    >
      <p className="text-white text-lg">Signing you in…</p>
    </main>
  );
}
