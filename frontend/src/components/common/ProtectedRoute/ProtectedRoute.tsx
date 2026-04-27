import { type ReactElement,type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useParams } from 'react-router-dom';

import { BrandedLoader } from '@components/common/BrandedLoader';
import { useAuthStore } from '@features/auth/stores/authStore';
import { PATHS } from '@routes/config/paths';

interface ProtectedRouteProps {
  /** Content to render when authenticated. */
  children: ReactNode;
  /**
   * Where to redirect unauthenticated users (bare path without language prefix).
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
  const { lng = 'en' } = useParams<{ lng: string }>();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-[#152018]">
        <BrandedLoader size="lg" label={t('common.loading', 'Loading…')} fillParent={false} />
      </div>
    );
  }

  if (!isAuthenticated) {
    const target = redirectTo.startsWith('/')
      ? `/${lng}${redirectTo}`
      : redirectTo;

    return (
      <Navigate
        to={target}
        replace
        state={{ returnUrl: location.pathname }}
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
