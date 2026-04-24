import { type ReactElement, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { SEOHead } from '@components';
import { PATHS, routeMetadata } from '@routes/config/paths';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

import { authService } from '../services/auth.service';

type VerifyState = 'loading' | 'success' | 'error';

/**
 * EmailVerifyConfirmPage — /auth/email/verify?token=<token>
 *
 * Landing page when the user clicks the verification link in their email.
 * Reads the token from the query string and calls the verification endpoint.
 */
export function EmailVerifyConfirmPage(): ReactElement {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<VerifyState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;

    const token = searchParams.get('token');
    if (!token) {
      setState('error');
      setErrorMessage('No verification token found. Please check the link in your email.');
      return;
    }

    authService
      .verifyEmail(token)
      .then(() => {
        setState('success');
      })
      .catch(() => {
        setState('error');
        setErrorMessage(
          'This verification link is invalid or has expired. Please request a new one.',
        );
      });
  }, [searchParams]);

  return (
    <main className="min-h-screen bg-[#152018] flex items-center justify-center p-4">
      <SEOHead
        title={routeMetadata[PATHS.EMAIL_VERIFY_CONFIRM].title}
        description={routeMetadata[PATHS.EMAIL_VERIFY_CONFIRM].description}
        path={PATHS.EMAIL_VERIFY_CONFIRM}
        noIndex
      />
      <div className="text-center max-w-md space-y-6">
        {state === 'loading' && (
          <>
            <Loader2
              className="w-12 h-12 text-[#E4B643] mx-auto animate-spin"
              aria-hidden="true"
            />
            <h1 className="text-2xl font-bold text-white">
              Verifying your email…
            </h1>
            <p className="text-[#8C9C92]" aria-live="polite">
              Please wait while we confirm your email address.
            </p>
          </>
        )}

        {state === 'success' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-900/30 border border-green-700/40">
              <CheckCircle className="w-8 h-8 text-green-400" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold text-white">
              Email Verified!
            </h1>
            <p className="text-[#8C9C92]">
              Your email address has been verified. You can now list books, request swaps,
              and message other members.
            </p>
            <Link
              to={PATHS.LOGIN}
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#E4B643] text-[#152018] font-semibold hover:bg-[#d4a43a] transition-colors"
            >
              Sign in
            </Link>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-900/30 border border-red-700/40">
              <AlertCircle className="w-8 h-8 text-red-400" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold text-white">
              Verification Failed
            </h1>
            <p className="text-[#8C9C92]" role="alert">
              {errorMessage}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to={PATHS.LOGIN}
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#1A251D] border border-[#28382D] text-white font-semibold hover:bg-[#28382D] transition-colors"
              >
                Sign in
              </Link>
              <Link
                to={PATHS.EMAIL_VERIFY_PENDING}
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#E4B643] text-[#152018] font-semibold hover:bg-[#d4a43a] transition-colors"
              >
                Resend verification email
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
