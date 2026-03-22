import { useNavigate } from 'react-router-dom';

import { useDocumentTitle } from '@hooks';
import { PATHS, routeMetadata } from '@routes/config/paths';

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
      brandingTitle={
        <>
          Welcome to the{' '}
          <span className="text-[#E4B643] italic">Community</span>
        </>
      }
      brandingSubtitle="Join over 15,000 book lovers trading stories, sharing recommendations, and building a sustainable reading culture in Amsterdam."
      quote="I've discovered so many hidden gems through BookSwap. It's not just about the books, it's about connecting with neighbors who share my passion."
      authorName="Sarah Jenkins"
      authorDetails="Swapping since 2021"
      progress={50}
      formContent={
        <RegisterForm
          onSubmit={handleSubmit}
          onToggle={handleToggle}
        />
      }
    />
  );
}
