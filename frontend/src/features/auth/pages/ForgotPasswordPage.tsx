import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useDocumentTitle, useUserCity } from '@hooks';
import { useLocaleNavigate } from '@hooks/useLocaleNavigate';
import { PATHS, routeMetadata } from '@routes/config/paths';

import { AuthSplitPanel } from '../components/AuthSplitPanel/AuthSplitPanel';
import { ForgotPasswordForm } from '../components/ForgotPasswordForm/ForgotPasswordForm';
import { authService } from '../services/auth.service';

/**
 * ForgotPasswordPage
 *
 * Route: /forgot-password
 *
 * Uses the shared AuthSplitPanel layout matching the dark reference design.
 */
export function ForgotPasswordPage() {
  useDocumentTitle(routeMetadata[PATHS.FORGOT_PASSWORD].title);
  const { city } = useUserCity();
  const { t } = useTranslation();
  const navigate = useLocaleNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (email: string) => {
    setIsLoading(true);
    setServerError(null);
    try {
      await authService.requestPasswordReset(email);
      setSubmittedEmail(email);
      setIsSuccess(true);
    } catch {
      setServerError(t('auth.forgotPassword.error', 'Something went wrong. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthSplitPanel
      view="forgot"
      brandingTitle={
        <>
          Welcome to the{' '}
          <span className="text-[#E4B643] italic">Community</span>
        </>
      }
      brandingSubtitle={`Join over 15,000 book lovers trading stories, sharing recommendations, and building a sustainable reading culture in ${city}.`}
      quote="I've discovered so many hidden gems through BookSwap. It's not just about the books, it's about connecting with neighbors who share my passion."
      authorName="Sarah Jenkins"
      authorDetails="Swapping since 2021"
      formContent={
        <ForgotPasswordForm
          onSubmit={handleSubmit}
          onBack={() => void navigate(PATHS.LOGIN)}
          isLoading={isLoading}
          serverError={serverError}
          isSuccess={isSuccess}
          submittedEmail={submittedEmail}
        />
      }
    />
  );
}
