import type { FieldValues, Resolver } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { API } from '@configs/apiEndpoints';
import { APP_CONFIG } from '@configs/appConfig';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import { z } from 'zod';

import type { LoginPayload } from '../../types/auth.types';

// ---------------------------------------------------------------------------
// Inline Zod resolver
// ---------------------------------------------------------------------------

function makeZodResolver<T extends FieldValues>(schema: z.ZodType<T>): Resolver<T> {
  return async values => {
    const result = schema.safeParse(values);
    if (result.success) return { values: result.data, errors: {} };

    const errors: Record<string, { type: string; message: string }> = {};
    for (const issue of result.error.issues) {
      const key = String(issue.path[0] ?? issue.path.join('.'));
      if (!errors[key]) {
        errors[key] = { type: issue.code, message: issue.message };
      }
    }
    return { errors: errors as never, values: {} as never };
  };
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface LoginFormProps {
  onSubmit: (payload: LoginPayload) => void | Promise<void>;
  onToggle: () => void;
  onForgotPassword: () => void;
  isLoading?: boolean;
  serverError?: string | null;
}

// ---------------------------------------------------------------------------
// Component — "The Archival Naturalist" dark‑theme login
// ---------------------------------------------------------------------------

export function LoginForm({
  onSubmit,
  onToggle,
  onForgotPassword,
  isLoading = false,
  serverError,
}: LoginFormProps) {
  const { t } = useTranslation();

  const loginSchema = z.object({
    email_or_username: z.string().min(1, t('auth.credentialRequired', 'Email or username is required')),
    password: z.string().min(8, t('auth.passwordMin', 'Password must be at least 8 characters')),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof loginSchema>>({
    resolver: makeZodResolver(loginSchema),
    mode: 'onTouched',
  });

  return (
    <div>
      {/* Header row */}
      <div className="flex justify-end items-center mb-8">
        <button
          type="button"
          onClick={onToggle}
          className="text-sm font-medium text-[#E4B643] hover:underline"
        >
          {t('auth.newToBookswap', 'New to BookSwap? Create Account')}
        </button>
      </div>

      <h2 className="text-3xl font-bold text-white mb-2">
        {t('auth.pageTitle', 'Welcome Back')}
      </h2>
      <p className="text-text-secondary mb-8">
        {t('auth.welcomeBack', 'Sign in to continue your swapping journey.')}
      </p>

      {/* OAuth buttons */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button
          type="button"
          className="flex items-center justify-center gap-2 px-4 py-2.5 border border-border-dark rounded-xl bg-background-dark hover:bg-border-dark transition-colors"
          onClick={() => { window.location.href = APP_CONFIG.apiUrl + API.auth.socialLoginStart('google-oauth2'); }}
        >
          <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <span className="text-sm font-medium text-white">
            {t('auth.google', 'Google')}
          </span>
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-2 px-4 py-2.5 border border-border-dark rounded-xl bg-background-dark hover:bg-border-dark transition-colors"
          aria-disabled="true"
          title={t('auth.appleComingSoon', 'Apple sign-in coming soon')}
        >
          <svg aria-hidden="true" className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13.064 3.245c.083 1.838-1.077 3.515-2.22 4.14-1.082.59-2.61.542-3.32-.437-.767-1.055-.386-3.058.74-4.22 1.05-1.085 3.033-1.127 4.8-.517zM12.986 6.94c2.256-.254 3.733 1.258 4.256 1.638 1.488-1.083 3.03-1.01 3.597-.733.204 1.144-.64 2.45-1.637 3.692-1.22 1.517-1.11 3.284.225 5.176 1.156 1.634.355 3.525-1.074 4.137-1.23.527-2.68.32-4.103-.23-1.378-.535-2.716-.475-4.102-.036-1.554.49-3.023.76-4.39-.023-1.572-.9-2.072-2.73-1.074-4.137 1.063-1.498 1.405-3.23.366-4.996-.803-1.365-1.353-2.623-.42-3.832.613-.794 1.76-1.464 3.23-1.233.91.143 1.95.83 2.76 1.255.856.45 1.795.397 2.366-.68z" />
          </svg>
          <span className="text-sm font-medium text-white">
            {t('auth.apple', 'Apple')}
          </span>
        </button>
      </div>

      {/* Divider */}
      <div className="relative mb-8">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-border-dark" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-surface-dark text-text-secondary">
            {t('auth.orSignInWithEmail', 'Or sign in with email')}
          </span>
        </div>
      </div>

      {/* Form */}
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1" htmlFor="email_or_username">
            {t('auth.credentialLabel', 'Email or Username')}
          </label>
          <div className="relative">
            <input
              id="email_or_username"
              type="text"
              autoComplete="username"
              placeholder="you@example.com"
              className={`block w-full pl-10 pr-3 py-3 border rounded-xl sm:text-sm bg-[#152018] text-white placeholder-[#5A6A60] transition-colors focus:ring-[#E4B643] focus:border-[#E4B643] ${
                errors.email_or_username ? 'border-red-500' : 'border-[#28382D]'
              }`}
              {...register('email_or_username')}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="text-text-muted w-5 h-5" aria-hidden="true" />
            </div>
          </div>
          {errors.email_or_username && (
            <p className="mt-1 text-xs text-red-400" role="alert">
              {errors.email_or_username.message as string}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-text-secondary" htmlFor="login-password">
              {t('auth.passwordLabel', 'Password')}
            </label>
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-sm font-medium text-[#E4B643] hover:underline"
            >
              {t('auth.forgotPassword', 'Forgot password?')}
            </button>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className={`block w-full pl-10 pr-3 py-3 border rounded-xl sm:text-sm bg-[#152018] text-white placeholder-[#5A6A60] transition-colors focus:ring-[#E4B643] focus:border-[#E4B643] ${
                errors.password ? 'border-red-500' : 'border-[#28382D]'
              }`}
              {...register('password')}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="text-text-muted w-5 h-5" aria-hidden="true" />
            </div>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-400" role="alert">
              {errors.password.message as string}
            </p>
          )}
        </div>

        {serverError && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3" role="alert">
            <p className="text-sm text-red-400">{serverError}</p>
          </div>
        )}

        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            aria-busy={isLoading}
            className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-[#152018] bg-[#E4B643] hover:bg-[#d9b93e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E4B643] transition-colors disabled:opacity-60"
          >
            {isLoading
              ? t('auth.loading', 'Signing in…')
              : t('auth.submit', 'Sign In')}
            {!isLoading && <ArrowRight className="w-4 h-4" aria-hidden="true" />}
          </button>
        </div>
      </form>
    </div>
  );
}
