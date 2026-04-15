import type { ReactElement } from 'react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import { useDocumentTitle, useUserCity } from '@hooks';
import { useLocaleNavigate } from '@hooks/useLocaleNavigate';
import { PATHS, routeMetadata } from '@routes/config/paths';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import type { AuthView } from '../components/AuthSplitPanel/AuthSplitPanel';
import { AuthSplitPanel } from '../components/AuthSplitPanel/AuthSplitPanel';
import { ForgotPasswordForm } from '../components/ForgotPasswordForm/ForgotPasswordForm';
import { LoginForm } from '../components/LoginForm/LoginForm';
import { RegisterForm } from '../components/RegisterForm/RegisterForm';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/auth.service';
import type { LoginPayload, RegisterPayload } from '../types/auth.types';

const VIEW_ORDER: Record<AuthView, number> = { register: -1, login: 0, forgot: 1 };

function pathToView(pathname: string): AuthView {
  if (pathname.endsWith('/register')) return 'register';
  if (pathname.endsWith('/forgot-password')) return 'forgot';
  return 'login';
}

// Per-view branding content for the split panel
const BRANDING: Record<
  AuthView,
  {
    title: ReactElement;
    subtitle: string;
    quote: string;
    authorName: string;
    authorDetails: string;
    progress: number;
  }
> = {
  login: {
    title: (
      <>
        Welcome Back to the{' '}
        <span className="text-[#E4B643] italic">Community</span>
      </>
    ),
    subtitle:
      'Your next favorite story is waiting. Reconnect with fellow book lovers in Amsterdam.',
    quote:
      "The quality of books I've found here is incredible. It feels like browsing a curated boutique, but everything is free to swap!",
    authorName: 'Elena Rodriguez',
    authorDetails: 'Member since 2022',
    progress: 100,
  },
  register: {
    title: (
      <>
        Welcome to the{' '}
        <span className="text-[#E4B643] italic">Community</span>
      </>
    ),
    subtitle:
      'Join over 15,000 book lovers trading stories, sharing recommendations, and building a sustainable reading culture in Amsterdam.',
    quote:
      "I've discovered so many hidden gems through BookSwap. It's not just about the books, it's about connecting with neighbors who share my passion.",
    authorName: 'Sarah Jenkins',
    authorDetails: 'Swapping since 2021',
    progress: 50,
  },
  forgot: {
    title: (
      <>
        Reset Your{' '}
        <span className="text-[#E4B643] italic">Password</span>
      </>
    ),
    subtitle:
      "No worries — it happens to the best of us. We'll help you get back to your books.",
    quote:
      'The support team got me back into my account in minutes. Fantastic community!',
    authorName: 'David Park',
    authorDetails: 'Member since 2023',
    progress: 100,
  },
};

export function AuthPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useLocaleNavigate();
  const prefersReducedMotion = useReducedMotion();

  const view = pathToView(location.pathname);
  const branding = BRANDING[view];
  const { city } = useUserCity();
  const citySubtitles: Partial<Record<AuthView, string>> = {
    login: `Your next favorite story is waiting. Reconnect with fellow book lovers in ${city}.`,
    register: `Join over 15,000 book lovers trading stories, sharing recommendations, and building a sustainable reading culture in ${city}.`,
  };

  useDocumentTitle(
    view === 'register'
      ? routeMetadata[PATHS.REGISTER].title
      : view === 'forgot'
        ? routeMetadata[PATHS.FORGOT_PASSWORD].title
        : routeMetadata[PATHS.LOGIN].title,
  );

  const directionRef = useRef<1 | -1>(1);

  const navigateTo = (target: AuthView) => {
    const targetPath =
      target === 'register' ? PATHS.REGISTER
      : target === 'forgot' ? PATHS.FORGOT_PASSWORD
      : PATHS.LOGIN;
    directionRef.current = VIEW_ORDER[target] > VIEW_ORDER[view] ? 1 : -1;
    void navigate(targetPath, { replace: true });
  };

  // ── Login logic ────────────────────────────────────────────────────────
  const { login, isLoading, error } = useAuth();
  const returnUrl = (location.state as { returnUrl?: string } | null)?.returnUrl;

  const handleLoginSubmit = async (payload: LoginPayload) => {
    try {
      await login(payload);
      void navigate(returnUrl ?? PATHS.HOME, { replace: true });
    } catch {
      // error is captured in the auth store's `error` state
    }
  };

  // ── Register logic ─────────────────────────────────────────────────────
  const handleRegisterSubmit = async (payload: RegisterPayload) => {
    await authService.register(payload);
    void navigate(PATHS.LOGIN, { replace: true, state: { registered: true } });
  };

  // ── Forgot password logic ──────────────────────────────────────────────
  const [fpLoading, setFpLoading] = useState(false);
  const [fpSuccess, setFpSuccess] = useState(false);
  const [fpSubmittedEmail, setFpSubmittedEmail] = useState('');
  const [fpError, setFpError] = useState<string | null>(null);

  const handleForgotSubmit = async (email: string) => {
    setFpLoading(true);
    setFpError(null);
    try {
      await authService.requestPasswordReset(email);
      setFpSubmittedEmail(email);
      setFpSuccess(true);
    } catch {
      setFpError(t('auth.forgotPassword.error', 'Something went wrong. Please try again.'));
    } finally {
      setFpLoading(false);
    }
  };

  // ── Animated form transitions ──────────────────────────────────────────
  const formVariants = prefersReducedMotion
    ? {}
    : {
        initial: (dir: 1 | -1) => ({ opacity: 0, x: dir * 20 }),
        animate: { opacity: 1, x: 0 },
        exit: (dir: 1 | -1) => ({ opacity: 0, x: -dir * 20 }),
      };

  const formTransition = { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <AuthSplitPanel
      view={view}
      brandingTitle={branding.title}
      brandingSubtitle={citySubtitles[view] ?? branding.subtitle}
      quote={branding.quote}
      authorName={branding.authorName}
      authorDetails={branding.authorDetails}
      progress={branding.progress}
      formContent={
        <AnimatePresence mode="wait" custom={directionRef.current}>
          {view === 'login' && (
            <motion.div
              key="login"
              custom={directionRef.current}
              variants={formVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={formTransition}
            >
              <LoginForm
                onSubmit={handleLoginSubmit}
                onToggle={() => navigateTo('register')}
                onForgotPassword={() => navigateTo('forgot')}
                isLoading={isLoading}
                serverError={error}
              />
            </motion.div>
          )}
          {view === 'register' && (
            <motion.div
              key="register"
              custom={directionRef.current}
              variants={formVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={formTransition}
            >
              <RegisterForm
                onSubmit={handleRegisterSubmit}
                onToggle={() => navigateTo('login')}
              />
            </motion.div>
          )}
          {view === 'forgot' && (
            <motion.div
              key="forgot"
              custom={directionRef.current}
              variants={formVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={formTransition}
            >
              <ForgotPasswordForm
                onSubmit={handleForgotSubmit}
                onBack={() => navigateTo('login')}
                isLoading={fpLoading}
                serverError={fpError}
                isSuccess={fpSuccess}
                submittedEmail={fpSubmittedEmail}
              />
            </motion.div>
          )}
        </AnimatePresence>
      }
    />
  );
}
