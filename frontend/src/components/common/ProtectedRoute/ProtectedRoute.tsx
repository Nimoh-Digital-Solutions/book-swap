import { type ReactElement,type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuthStore } from '@features/auth/stores/authStore';
import { PATHS } from '@routes/config/paths';

interface ProtectedRouteProps {
  /** Content to render when authenticated. */
  children: ReactNode;
  /**
   * Where to redirect unauthenticated users.
   * Defaults to the login page.
   */
  redirectTo?: string;
}

/**
 * ProtectedRoute — guards a route behind the Zustand auth store.
 *
 * - While `isLoading` (e.g. silent token refresh on page load), shows a
 *   loading indicator so the user isn't briefly flashed to login.
 * - When unauthenticated, redirects to `redirectTo` (default: `/login`)
 *   and captures the current URL as `returnUrl` in router state so
 *   LoginPage can redirect back after login.
 * - When authenticated, renders `children`.
 */
const ProtectedRoute = ({
  children,
  redirectTo = PATHS.LOGIN,
}: ProtectedRouteProps): ReactElement => {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const isLoading = useAuthStore(s => s.isLoading);
  const location = useLocation();

  if (isLoading) {
    // Show a minimal loading state while auth bootstraps (silent refresh)
    return <div aria-busy="true" aria-live="polite">Loading…</div>;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={redirectTo}
        replace
        state={{ returnUrl: location.pathname }}
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
