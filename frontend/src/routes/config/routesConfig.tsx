import { lazy, type ReactElement,Suspense } from 'react';
import { RouteObject } from 'react-router-dom';

import ProtectedRoute from '@components/common/ProtectedRoute/ProtectedRoute';
import { PageLoader } from '@components/ui/PageLoader';
import { AppLayout } from '@layouts';

import { PATHS, routeMetadata } from './paths';

// Re-export PATHS and routeMetadata so existing imports from '@routes' / './config' still work
export { PATHS, routeMetadata };

// ---------------------------------------------------------------------------
// Route-level code splitting
// Each page is loaded as a separate chunk, fetched only when first visited.
// ---------------------------------------------------------------------------
const HomePage = lazy(() => import('@pages/HomePage/HomePage'));

const ComponentsDemoPage = lazy(() =>
  import('@pages/ComponentsDemoPage/ComponentsDemoPage').then(m => ({
    default: m.ComponentsDemoPage,
  }))
);

const NotFoundPage = lazy(() => import('@pages/NotFoundPage/NotFoundPage'));

const AuthPage = lazy(() =>
  import('@features/auth').then(m => ({ default: m.AuthPage }))
);

const AuthRoutesWrapper = lazy(() =>
  import('@features/auth').then(m => ({ default: m.AuthRoutesWrapper }))
);

const SettingsPage = lazy(() => import('@pages/SettingsPage/SettingsPage'));

/** Convenience wrapper: lazy page inside Suspense. */
const LazyPage = ({ component: Component }: { component: React.LazyExoticComponent<() => ReactElement> }): ReactElement => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

/** Convenience wrapper: protected lazy page. */
const ProtectedPage = ({ component: Component }: { component: React.LazyExoticComponent<() => ReactElement> }): ReactElement => (
  <ProtectedRoute>
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  </ProtectedRoute>
);

export const routes: RouteObject[] = [
  // ---------------------------------------------------------------------------
  // Auth route group
  // Full-screen split-panel pages — no AppLayout shell (no Header / Footer).
  // AuthRoutesWrapper redirects to HOME if the user is already authenticated.
  // ---------------------------------------------------------------------------
  {
    element: (
      <Suspense fallback={<PageLoader />}>
        <AuthRoutesWrapper />
      </Suspense>
    ),
    children: [
      {
        // AuthPage is a layout route that stays mounted for both /login and
        // /register, enabling the AuthSplitPanel layout-swap animation.
        element: (
          <Suspense fallback={<PageLoader />}>
            <AuthPage />
          </Suspense>
        ),
        children: [
          { path: PATHS.LOGIN, element: null },
          { path: PATHS.REGISTER, element: null },
          { path: PATHS.FORGOT_PASSWORD, element: null },
        ],
      },
    ],
  },
  // ---------------------------------------------------------------------------
  // App route group
  // Standard pages wrapped in AppLayout (Header + Footer + skip link).
  // ---------------------------------------------------------------------------
  {
    path: PATHS.HOME,
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <LazyPage component={HomePage} />,
      },
      {
        path: PATHS.COMPONENTS_DEMO,
        element: <LazyPage component={ComponentsDemoPage} />,
      },
      // -- Protected routes -------------------------------------------------
      // Add your authenticated routes here using the ProtectedPage wrapper:
      //
      //   {
      //     path: PATHS.DASHBOARD,
      //     element: <ProtectedPage component={DashboardPage} />,
      //   },
      {
        path: PATHS.SETTINGS,
        element: <ProtectedPage component={SettingsPage} />,
      },
    ],
  },
  {
    path: PATHS.NOT_FOUND,
    element: <LazyPage component={NotFoundPage} />,
  },
];

