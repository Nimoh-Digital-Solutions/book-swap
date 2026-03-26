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

const OnboardingPage = lazy(() =>
  import('@features/auth').then(m => ({ default: m.OnboardingPage }))
);

const ProfilePage = lazy(() =>
  import('@features/profile').then(m => ({ default: m.ProfilePage }))
);

const EditProfilePage = lazy(() =>
  import('@features/profile').then(m => ({ default: m.EditProfilePage }))
);

const PublicProfilePage = lazy(() =>
  import('@features/profile').then(m => ({ default: m.PublicProfilePage }))
);

const BrowsePage = lazy(() =>
  import('@features/discovery').then(m => ({ default: m.BrowsePage }))
);

const MyShelfPage = lazy(() =>
  import('@features/books').then(m => ({ default: m.MyShelfPage }))
);

const AddBookPage = lazy(() =>
  import('@features/books').then(m => ({ default: m.AddBookPage }))
);

const BookDetailPage = lazy(() =>
  import('@features/books').then(m => ({ default: m.BookDetailPage }))
);

const EditBookPage = lazy(() =>
  import('@features/books').then(m => ({ default: m.EditBookPage }))
);

const ExchangesPage = lazy(() =>
  import('@features/exchanges').then(m => ({ default: m.ExchangesPage }))
);

const ExchangeDetailPage = lazy(() =>
  import('@features/exchanges').then(m => ({ default: m.ExchangeDetailPage }))
);

const IncomingRequestsPage = lazy(() =>
  import('@features/exchanges').then(m => ({ default: m.IncomingRequestsPage }))
);

const PrivacyPolicyPage = lazy(() => import('@pages/PrivacyPolicyPage/PrivacyPolicyPage'));

const TermsOfServicePage = lazy(() => import('@pages/TermsOfServicePage/TermsOfServicePage'));

const NotificationUnsubscribePage = lazy(() =>
  import('@features/notifications').then(m => ({ default: m.UnsubscribePage }))
);

const SocialAuthCallbackPage = lazy(() =>
  import('@features/auth').then(m => ({ default: m.SocialAuthCallbackPage }))
);

const SocialAuthErrorPage = lazy(() =>
  import('@features/auth').then(m => ({ default: m.SocialAuthErrorPage }))
);

const EmailVerifyPendingPage = lazy(() =>
  import('@features/auth').then(m => ({ default: m.EmailVerifyPendingPage }))
);

const EmailVerifyConfirmPage = lazy(() =>
  import('@features/auth').then(m => ({ default: m.EmailVerifyConfirmPage }))
);

const PasswordResetConfirmPage = lazy(() =>
  import('@features/auth').then(m => ({ default: m.PasswordResetConfirmPage }))
);

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
      {
        path: PATHS.ONBOARDING,
        element: (
          <Suspense fallback={<PageLoader />}>
            <OnboardingPage />
          </Suspense>
        ),
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
      {
        path: PATHS.CATALOGUE,
        element: <LazyPage component={BrowsePage} />,
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
      {
        path: PATHS.PROFILE,
        element: <ProtectedPage component={ProfilePage} />,
      },
      {
        path: PATHS.PROFILE_EDIT,
        element: <ProtectedPage component={EditProfilePage} />,
      },
      {
        path: PATHS.PUBLIC_PROFILE,
        element: <ProtectedPage component={PublicProfilePage} />,
      },
      {
        path: PATHS.MY_SHELF,
        element: <ProtectedPage component={MyShelfPage} />,
      },
      {
        path: PATHS.ADD_BOOK,
        element: <ProtectedPage component={AddBookPage} />,
      },
      {
        path: PATHS.BOOK_DETAIL,
        element: <ProtectedPage component={BookDetailPage} />,
      },
      {
        path: PATHS.EDIT_BOOK,
        element: <ProtectedPage component={EditBookPage} />,
      },
      {
        path: PATHS.INCOMING_REQUESTS,
        element: <ProtectedPage component={IncomingRequestsPage} />,
      },
      {
        path: PATHS.EXCHANGE_DETAIL,
        element: <ProtectedPage component={ExchangeDetailPage} />,
      },
      {
        path: PATHS.EXCHANGES,
        element: <ProtectedPage component={ExchangesPage} />,
      },
      {
        path: PATHS.PRIVACY_POLICY,
        element: <LazyPage component={PrivacyPolicyPage} />,
      },
      {
        path: PATHS.TERMS_OF_SERVICE,
        element: <LazyPage component={TermsOfServicePage} />,
      },
      {
        path: PATHS.NOTIFICATION_UNSUBSCRIBE,
        element: <LazyPage component={NotificationUnsubscribePage} />,
      },
    ],
  },
  {
    path: PATHS.NOT_FOUND,
    element: <LazyPage component={NotFoundPage} />,
  },
  {
    path: PATHS.SOCIAL_AUTH_CALLBACK,
    element: <LazyPage component={SocialAuthCallbackPage} />,
  },
  {
    path: PATHS.SOCIAL_AUTH_ERROR,
    element: <LazyPage component={SocialAuthErrorPage} />,
  },
  {
    path: PATHS.EMAIL_VERIFY_PENDING,
    element: <LazyPage component={EmailVerifyPendingPage} />,
  },
  {
    path: PATHS.EMAIL_VERIFY_CONFIRM,
    element: <LazyPage component={EmailVerifyConfirmPage} />,
  },
  {
    path: PATHS.PASSWORD_RESET_CONFIRM,
    element: <LazyPage component={PasswordResetConfirmPage} />,
  },
];

