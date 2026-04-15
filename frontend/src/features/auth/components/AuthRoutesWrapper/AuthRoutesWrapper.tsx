import { Navigate, Outlet, useParams } from 'react-router-dom';

import { PATHS } from '@routes/config/paths';

import { useAuth } from '../../hooks/useAuth';

/**
 * AuthRoutesWrapper
 *
 * Layout route wrapper for all authentication screens (/:lng/login, etc.).
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
  const { lng = 'en' } = useParams<{ lng: string }>();

  if (isAuthenticated) {
    return <Navigate to={`/${lng}${PATHS.HOME}`} replace />;
  }

  return <Outlet />;
}
