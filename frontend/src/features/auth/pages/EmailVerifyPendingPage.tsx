import { type ReactElement, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useDocumentTitle } from '@hooks';
import { PATHS, routeMetadata } from '@routes/config/paths';
import { CheckCircle, Mail, RefreshCw } from 'lucide-react';

import { authService } from '../services/auth.service';
import { useAuthStore } from '../stores/authStore';

type ResendState = 'idle' | 'sending' | 'sent' | 'error';

/**
 * EmailVerifyPendingPage — /auth/email/verify-pending
 *
 * Shown after registration (for email users) to prompt the user to check
 * their inbox and verify their email. Includes a "Resend" button.
 */
export function EmailVerifyPendingPage(): ReactElement {
  const { t } = useTranslation('trust-safety');
  const user = useAuthStore((s) => s.user);
  const [resendState, setResendState] = useState<ResendState>('idle');

  useDocumentTitle(routeMetadata[PATHS.EMAIL_VERIFY_PENDING].title);

  const handleResend = useCallback(async () => {
    setResendState('sending');
    try {
      await authService.resendVerificationEmail();
      setResendState('sent');
    } catch {
      setResendState('error');
    }
  }, []);

  return (
    <main className="min-h-screen bg-[#152018] flex items-center justify-center p-4">
      <div className="text-center max-w-md space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#1A251D] border border-[#28382D]">
          <Mail className="w-8 h-8 text-[#E4B643]" aria-hidden="true" />
        </div>

        <h1 className="text-2xl font-bold text-white">
          {t('emailGate.title', 'Check Your Email')}
        </h1>

        <p className="text-[#8C9C92]">
          We&apos;ve sent a verification link to{' '}
          <span className="text-white font-medium">{user?.email ?? 'your email'}</span>.
          Click the link in the email to activate your account.
        </p>

        <div className="space-y-3">
          {resendState === 'sent' ? (
            <div
              className="inline-flex items-center gap-2 text-sm text-green-400"
              role="status"
            >
              <CheckCircle className="w-4 h-4" aria-hidden="true" />
              {t('emailGate.resent', 'Verification email sent!')}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendState === 'sending'}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1A251D] border border-[#28382D] text-[#E4B643] font-semibold text-sm hover:bg-[#28382D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                className={`w-4 h-4 ${resendState === 'sending' ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              {resendState === 'sending'
                ? t('emailGate.resending', 'Sending…')
                : t('emailGate.resend', 'Resend Verification Email')}
            </button>
          )}

          {resendState === 'error' && (
            <p className="text-sm text-red-400" role="alert">
              {t('emailGate.resendError', 'Failed to resend. Try again later.')}
            </p>
          )}
        </div>

        <p className="text-xs text-[#8C9C92]">
          Already verified?{' '}
          <Link
            to={PATHS.LOGIN}
            className="text-[#E4B643] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
