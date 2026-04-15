import { useState } from 'react';

import { useDocumentTitle, useUserCity } from '@hooks';
import { useLocaleNavigate } from '@hooks/useLocaleNavigate';
import { PATHS, routeMetadata } from '@routes/config/paths';
import { HttpError } from '@services';

import { AuthSplitPanel } from '../components/AuthSplitPanel/AuthSplitPanel';
import { RegisterForm } from '../components/RegisterForm/RegisterForm';
import { authService } from '../services/auth.service';
import type { RegisterPayload } from '../types/auth.types';

export function RegisterPage() {
  useDocumentTitle(routeMetadata[PATHS.REGISTER].title);
  const { city } = useUserCity();
  const navigate = useLocaleNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (payload: RegisterPayload) => {
    setIsLoading(true);
    setServerError(null);
    try {
      await authService.register(payload);
      void navigate(PATHS.LOGIN, {
        replace: true,
        state: { registered: true },
      });
    } catch (err) {
      if (err instanceof HttpError) {
        const detail = (err.body as Record<string, unknown> | null)?.detail;
        setServerError(
          typeof detail === 'string'
            ? detail
            : 'Registration failed. Please check your details and try again.',
        );
      } else {
        setServerError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = () => void navigate(PATHS.LOGIN, { replace: true });

  return (
    <AuthSplitPanel
      view="register"
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
      progress={50}
      formContent={
        <RegisterForm
          onSubmit={handleSubmit}
          onToggle={handleToggle}          isLoading={isLoading}
          serverError={serverError}        />
      }
    />
  );
}
