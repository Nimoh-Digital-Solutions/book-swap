import { lazy, type ReactElement, Suspense } from 'react';
import { RouteObject } from 'react-router-dom';

import ProtectedRoute from '@components/common/ProtectedRoute/ProtectedRoute';
import { PageLoader } from '@components/ui/PageLoader';
import { AppLayout } from '@layouts';

import { PATHS, routeMetadata } from './paths';

export { PATHS, routeMetadata };

// ---------------------------------------------------------------------------
// Language routing components
// ---------------------------------------------------------------------------
import { LanguageRedirect } from '../components/LanguageRedirect';
import { LanguageSync } from '../components/LanguageSync';

// ---------------------------------------------------------------------------
// Route-level code splitting
// Each page is loaded as a separate chunk, fetched only when first visited.
// ---------------------------------------------------------------------------
const HomePage = lazy(() => import('@pages/HomePage/HomePage'));

const ComponentsDemoPage = import.meta.env.DEV
  ? lazy(() =>
      import('@pages/ComponentsDemoPage/ComponentsDemoPage').then(m => ({
        default: m.ComponentsDemoPage,
      }))
    )
  : null;

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

const CataloguePage = lazy(() =>
  import('@features/discovery').then(m => ({ default: m.CataloguePage }))
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

const BrowseLandingPage = lazy(() => import('@pages/BrowseLandingPage/BrowseLandingPage'));

const MapPage = lazy(() => import('@pages/MapPage/MapPage'));

const HowItWorksPage = lazy(() => import('@pages/HowItWorksPage/HowItWorksPage'));

const CommunityPage = lazy(() => import('@pages/CommunityPage/CommunityPage'));

const PrivacyPolicyPage = lazy(() => import('@pages/PrivacyPolicyPage/PrivacyPolicyPage'));

const TermsOfServicePage = lazy(() => import('@pages/TermsOfServicePage/TermsOfServicePage'));

const AccountDeletionPage = lazy(() => import('@pages/AccountDeletionPage/AccountDeletionPage'));

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

/** Strip leading `/` so a PATHS constant can be used as a relative route path. */
function rel(path: string): string {
  return path.startsWith('/') ? path.slice(1) : path;
}

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

// ---------------------------------------------------------------------------
// Application routes nested under `/:lng` for locale-prefixed URLs.
//
// URL examples:
//   /en          → Home (English)
//   /fr/login    → Login (French)
//   /nl/catalogue → Catalogue (Dutch)
//
// Bare paths without a language prefix (e.g. `/login`) are caught by the
// fallback `*` route and redirected to `/{detected-lang}/login`.
// ---------------------------------------------------------------------------

export const routes: RouteObject[] = [
  // ── Root-level social auth redirects ─────────────────────────────────────
  // The backend redirects to /auth/verified without a language prefix.
  // These must sit above :lng so "auth" isn't mistaken for a language code.
  {
    path: 'auth/verified',
    element: <LanguageRedirect />,
  },
  {
    path: 'auth/verify-error',
    element: <LanguageRedirect />,
  },

  // ── Language-prefixed routes ──────────────────────────────────────────────
  {
    path: ':lng',
    element: <LanguageSync />,
    children: [
      // Auth route group — full-screen, no AppLayout shell
      {
        element: (
          <Suspense fallback={<PageLoader />}>
            <AuthRoutesWrapper />
          </Suspense>
        ),
        children: [
          {
            element: (
              <Suspense fallback={<PageLoader />}>
                <AuthPage />
              </Suspense>
            ),
            children: [
              { path: rel(PATHS.LOGIN), element: null },
              { path: rel(PATHS.REGISTER), element: null },
              { path: rel(PATHS.FORGOT_PASSWORD), element: null },
            ],
          },
          {
            path: rel(PATHS.ONBOARDING),
            element: (
              <Suspense fallback={<PageLoader />}>
                <OnboardingPage />
              </Suspense>
            ),
          },
        ],
      },

      // App route group — standard pages with Header + Footer
      {
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <LazyPage component={HomePage} />,
          },
          ...(import.meta.env.DEV && ComponentsDemoPage
            ? [
                {
                  path: rel(PATHS.COMPONENTS_DEMO),
                  element: <LazyPage component={ComponentsDemoPage} />,
                },
              ]
            : []),
          {
            path: rel(PATHS.BROWSE),
            element: <LazyPage component={BrowseLandingPage} />,
          },
          {
            path: rel(PATHS.HOW_IT_WORKS),
            element: <LazyPage component={HowItWorksPage} />,
          },
          {
            path: rel(PATHS.COMMUNITY),
            element: <LazyPage component={CommunityPage} />,
          },
          {
            path: rel(PATHS.CATALOGUE),
            element: <LazyPage component={CataloguePage} />,
          },
          {
            path: rel(PATHS.MAP),
            element: <LazyPage component={MapPage} />,
          },
          {
            path: rel(PATHS.SETTINGS),
            element: <ProtectedPage component={SettingsPage} />,
          },
          {
            path: rel(PATHS.PROFILE),
            element: <ProtectedPage component={ProfilePage} />,
          },
          {
            path: rel(PATHS.PROFILE_EDIT),
            element: <ProtectedPage component={EditProfilePage} />,
          },
          {
            path: rel(PATHS.PUBLIC_PROFILE),
            element: <ProtectedPage component={PublicProfilePage} />,
          },
          {
            path: rel(PATHS.MY_SHELF),
            element: <ProtectedPage component={MyShelfPage} />,
          },
          {
            path: rel(PATHS.ADD_BOOK),
            element: <ProtectedPage component={AddBookPage} />,
          },
          {
            path: rel(PATHS.BOOK_DETAIL),
            element: <ProtectedPage component={BookDetailPage} />,
          },
          {
            path: rel(PATHS.EDIT_BOOK),
            element: <ProtectedPage component={EditBookPage} />,
          },
          {
            path: rel(PATHS.INCOMING_REQUESTS),
            element: <ProtectedPage component={IncomingRequestsPage} />,
          },
          {
            path: rel(PATHS.EXCHANGE_DETAIL),
            element: <ProtectedPage component={ExchangeDetailPage} />,
          },
          {
            path: rel(PATHS.EXCHANGES),
            element: <ProtectedPage component={ExchangesPage} />,
          },
          {
            path: rel(PATHS.PRIVACY_POLICY),
            element: <LazyPage component={PrivacyPolicyPage} />,
          },
          {
            path: rel(PATHS.TERMS_OF_SERVICE),
            element: <LazyPage component={TermsOfServicePage} />,
          },
          {
            path: rel(PATHS.ACCOUNT_DELETION),
            element: <LazyPage component={AccountDeletionPage} />,
          },
          {
            path: rel(PATHS.NOTIFICATION_UNSUBSCRIBE),
            element: <LazyPage component={NotificationUnsubscribePage} />,
          },
        ],
      },

      // Standalone routes within the language context
      {
        path: rel(PATHS.SOCIAL_AUTH_CALLBACK),
        element: <LazyPage component={SocialAuthCallbackPage} />,
      },
      {
        path: rel(PATHS.SOCIAL_AUTH_ERROR),
        element: <LazyPage component={SocialAuthErrorPage} />,
      },
      {
        path: rel(PATHS.EMAIL_VERIFY_PENDING),
        element: <LazyPage component={EmailVerifyPendingPage} />,
      },
      {
        path: rel(PATHS.EMAIL_VERIFY_CONFIRM),
        element: <LazyPage component={EmailVerifyConfirmPage} />,
      },
      {
        path: rel(PATHS.PASSWORD_RESET_CONFIRM),
        element: <LazyPage component={PasswordResetConfirmPage} />,
      },

      // Catch-all 404 within the language context
      {
        path: '*',
        element: <LazyPage component={NotFoundPage} />,
      },
    ],
  },

  // ── Bare-path fallback ────────────────────────────────────────────────────
  // Redirects any URL without a language prefix to `/{detected-lang}/...`
  {
    path: '*',
    element: <LanguageRedirect />,
  },
];
