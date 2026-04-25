import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';

import { SEOHead } from '@components';
import { PATHS, routeMetadata } from '@routes/config/paths';

const REASON_MAP: Record<string, { title: string; message: string }> = {
  oauth_error: {
    title: 'Google sign-in failed',
    message: "Your session may have expired, cookies may be blocked, or you cancelled sign-in.",
  },
  social_auth_failed: {
    title: 'Google sign-in failed',
    message: "We couldn't complete your Google sign-in. Please try again.",
  },
  expired_or_invalid: {
    title: 'Link expired or invalid',
    message: 'The sign-in link has expired. Please try signing in again.',
  },
};

/**
 * SocialAuthErrorPage — /auth/verify-error
 *
 * Shown when the PSA pipeline fails or the exchange token is missing/invalid.
 * Reads ?reason= from the query string to display a tailored message.
 */
export function SocialAuthErrorPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason') ?? 'social_auth_failed';
  const content = REASON_MAP[reason] ?? {
    title: t('auth.social.errorTitle', 'Sign-in failed'),
    message: t('auth.social.errorMessage', "We couldn't complete your Google sign-in. Please try again."),
  };

  return (
    <main className="min-h-[100dvh] bg-background-dark flex items-center justify-center p-4">
      <SEOHead
        title={routeMetadata[PATHS.SOCIAL_AUTH_ERROR].title}
        description={routeMetadata[PATHS.SOCIAL_AUTH_ERROR].description}
        path={PATHS.SOCIAL_AUTH_ERROR}
        noIndex
      />
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-white mb-4">
          {t(`auth.social.${reason}.title`, content.title)}
        </h1>
        <p className="text-text-secondary mb-8">
          {t(`auth.social.${reason}.message`, content.message)}
        </p>
        <Link
          to={PATHS.REGISTER}
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#E4B643] text-[#152018] font-semibold hover:bg-[#d4a43a] transition-colors"
        >
          {t('auth.social.tryAgain', 'Try again')}
        </Link>
      </div>
    </main>
  );
}
