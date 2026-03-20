import { Navigate, Outlet } from 'react-router-dom';

import { PATHS } from '@routes/config/paths';

import { useAuth } from '../../hooks/useAuth';

/**
 * AuthRoutesWrapper
 *
 * Layout route wrapper for all authentication screens (/login, /register,
 * /forgot-password, /password-reset/confirm).
 *
 * Behaviour:
 *  - If the user is already authenticated, immediately redirects to the
 *    home page (prevents authenticated users seeing auth screens).
 *  - Otherwise renders the nested auth route via <Outlet />.
 *
 * Note: This wrapper intentionally renders no layout shell — auth pages are
 * full-screen split-panel views with no Header or Footer.
 */
export function AuthRoutesWrapper() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={PATHS.HOME} replace />;
  }

  return <Outlet />;
}
