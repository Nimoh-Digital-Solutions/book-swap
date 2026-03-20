import { useNavigate } from 'react-router-dom';

import { useDocumentTitle } from '@hooks';
import { PATHS, routeMetadata } from '@routes/config/paths';

import { AuthBranding } from '../components/AuthBranding/AuthBranding';
import { AuthSplitPanel } from '../components/AuthSplitPanel/AuthSplitPanel';
import { RegisterForm } from '../components/RegisterForm/RegisterForm';
import { authService } from '../services/auth.service';
import type { RegisterPayload } from '../types/auth.types';

export function RegisterPage() {
  useDocumentTitle(routeMetadata[PATHS.REGISTER].title);
  const navigate = useNavigate();

  const handleSubmit = async (payload: RegisterPayload) => {
    await authService.register(payload);
    void navigate(PATHS.LOGIN, {
      replace: true,
      state: { registered: true },
    });
  };

  const handleToggle = () => void navigate(PATHS.LOGIN, { replace: true });

  return (
    <AuthSplitPanel
      view="register"
      brandingContent={<AuthBranding view="register" />}
      formContent={
        <RegisterForm
          onSubmit={handleSubmit}
          onToggle={handleToggle}
        />
      }
    />
  );
}
