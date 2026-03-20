import { useLocation, useNavigate } from 'react-router-dom';

import { useDocumentTitle } from '@hooks';
import { PATHS, routeMetadata } from '@routes/config/paths';

import { AuthBranding } from '../components/AuthBranding/AuthBranding';
import { AuthSplitPanel } from '../components/AuthSplitPanel/AuthSplitPanel';
import { LoginForm } from '../components/LoginForm/LoginForm';
import { useAuth } from '../hooks/useAuth';
import type { LoginPayload } from '../types/auth.types';

export function LoginPage() {
  useDocumentTitle(routeMetadata[PATHS.LOGIN].title);
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const returnUrl = (location.state as { returnUrl?: string } | null)?.returnUrl;

  const handleSubmit = async (payload: LoginPayload) => {
    try {
      await login(payload);
      void navigate(returnUrl ?? PATHS.HOME, { replace: true });
    } catch {
      // error is already captured in the store's `error` state
    }
  };

  const handleToggle = () => void navigate(PATHS.REGISTER, { replace: true });
  const handleForgotPassword = () => void navigate(PATHS.FORGOT_PASSWORD, { replace: true });

  return (
    <AuthSplitPanel
      view="login"
      brandingContent={<AuthBranding view="login" />}
      formContent={
        <LoginForm
          onSubmit={handleSubmit}
          onToggle={handleToggle}
          onForgotPassword={handleForgotPassword}
          isLoading={isLoading}
          serverError={error}
        />
      }
    />
  );
}
