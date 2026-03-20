import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useDocumentTitle } from '@hooks';
import { PATHS, routeMetadata } from '@routes/config/paths';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { AuthBranding } from '../components/AuthBranding/AuthBranding';
import type { AuthView } from '../components/AuthSplitPanel/AuthSplitPanel';
import { AuthSplitPanel } from '../components/AuthSplitPanel/AuthSplitPanel';
import { ForgotPasswordForm } from '../components/ForgotPasswordForm/ForgotPasswordForm';
import { LoginForm } from '../components/LoginForm/LoginForm';
import { RegisterForm } from '../components/RegisterForm/RegisterForm';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/auth.service';
import type { LoginPayload, RegisterPayload } from '../types/auth.types';

// Spatial ordering used to determine slide direction: lower = left, higher = right.
const VIEW_ORDER: Record<AuthView, number> = { register: -1, login: 0, forgot: 1 };

function pathToView(pathname: string): AuthView {
  if (pathname === PATHS.REGISTER) return 'register';
  if (pathname === PATHS.FORGOT_PASSWORD) return 'forgot';
  return 'login';
}

/**
 * AuthPage
 *
 * Single component that handles /login, /register, and /forgot-password routes.
 * By rendering as a shared layout route parent for all three paths it stays
 * mounted during navigation, allowing AuthSplitPanel's `motion.div layout`
 * animation to fire on every view change instead of being destroyed and
 * recreated on every route transition.
 *
 * Route tree:
 *   AuthRoutesWrapper
 *     AuthPage  ← stays mounted
 *       /login
 *       /register
 *       /forgot-password
 */
export function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  const view = pathToView(location.pathname);

  useDocumentTitle(
    view === 'register'
      ? routeMetadata[PATHS.REGISTER].title
      : view === 'forgot'
        ? routeMetadata[PATHS.FORGOT_PASSWORD].title
        : routeMetadata[PATHS.LOGIN].title,
  );

  // ── Direction tracking ─────────────────────────────────────────────────
  // Use a ref so that updating direction before navigate() means the new
  // direction value is already in place when React's next render runs the
  // AnimatePresence exit/enter animations.
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
      setFpError('Something went wrong. Please try again.');
    } finally {
      setFpLoading(false);
    }
  };

  // ── Form content animation ─────────────────────────────────────────────
  // Directional slide: direction 1 = new view enters from right / old exits left.
  //                    direction -1 = new view enters from left / old exits right.
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
      brandingContent={<AuthBranding view={view} />}
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
