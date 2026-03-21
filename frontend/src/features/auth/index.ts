/**
 * Auth feature public API
 *
 * Import from '@features/auth' in consuming code — never reach
 * into sub-directories directly from outside this feature.
 *
 * @example
 * import { LoginPage, useAuth, useAuthStore, useInitAuth } from '@features/auth';
 */
export { AuthBranding } from './components/AuthBranding/AuthBranding';
export { AuthRoutesWrapper } from './components/AuthRoutesWrapper/AuthRoutesWrapper';
export { AuthSplitPanel } from './components/AuthSplitPanel/AuthSplitPanel';
export { BackgroundPaths } from './components/BackgroundPaths/BackgroundPaths';
export { RegisterForm } from './components/RegisterForm/RegisterForm';
export { useAuth } from './hooks/useAuth';
export { useInitAuth } from './hooks/useInitAuth';
export { useSessionTimeout } from './hooks/useSessionTimeout';
export { initAuthInterceptors } from './interceptors';
export {
  authErrorInterceptor,
  authRequestInterceptor,
  csrfRequestInterceptor,
} from './interceptors/authInterceptors';
export { AuthPage } from './pages/AuthPage';
export { ForgotPasswordPage } from './pages/ForgotPasswordPage';
export { LoginPage } from './pages/LoginPage';
export { OnboardingPage } from './pages/OnboardingPage';
export { RegisterPage } from './pages/RegisterPage';
export { authService } from './services/auth.service';
export type { AuthStore } from './stores/authStore';
export { getCsrfToken, setCsrfToken,useAuthStore } from './stores/authStore';
export type {
  AuthActions,
  AuthState,
  AuthUser,
  CsrfResponse,
  LoginPayload,
  LoginResponse,
  RefreshResponse,
  RegisterPayload,
} from './types/auth.types';
