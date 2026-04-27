import { Suspense } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { I18nextProvider } from 'react-i18next';

import { ErrorBoundary, PageLoader, PwaUpdateBanner } from '@components';
import { captureException } from '@configs/sentry';
import { ThemeProvider } from '@contexts';
import { useInitAuth } from '@features/auth';
import { CookieConsentBanner } from '@features/trust-safety';
import { AppRouter } from '@routes';
import { queryClient } from '@services';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import i18n from './i18n';

import '@nimoh-digital-solutions/tast-ui/style.css';
import './App.scss';

// ---------------------------------------------------------------------------
// Error boundary callback — reports React render errors to Sentry
// ---------------------------------------------------------------------------
function handleBoundaryError(error: Error, info: React.ErrorInfo): void {
  captureException(error, { componentStack: info.componentStack ?? '' });
}

/**
 * AuthGate — initialises the auth subsystem (interceptors, silent refresh,
 * CSRF token) and shows a loading screen while bootstrapping.
 */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading } = useInitAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <Suspense fallback={<PageLoader />}>
            <ErrorBoundary onError={handleBoundaryError}>
              <ThemeProvider>
                <AuthGate>
                  <div className="app">
                    <AppRouter />
                    <PwaUpdateBanner />
                    <CookieConsentBanner />
                  </div>
                </AuthGate>
              </ThemeProvider>
            </ErrorBoundary>
          </Suspense>
        </I18nextProvider>
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
