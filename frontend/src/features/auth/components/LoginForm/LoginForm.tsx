import type { FieldValues, Resolver } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { ArrowRight, Lock, Mail, Wand2 } from 'lucide-react';
import { z } from 'zod';

import type { LoginPayload } from '../../types/auth.types';

import styles from './LoginForm.module.scss';

// ---------------------------------------------------------------------------
// Inline Zod resolver
// @hookform/resolvers v5 ships only utilities; write a thin adapter for Zod v4.
// Constraining to FieldValues lets TypeScript verify that T is a plain object
// record, matching react-hook-form's Resolver<T> expectation.
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
    // Cast: RHF's ResolverError<T> expects values:Record<string,never>; `never`
    // extends every type so this is safe — the values are never read on error.
    return { errors: errors as never, values: {} as never };
  };
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface LoginFormProps {
  /** Called with validated form data on successful submission. */
  onSubmit: (payload: LoginPayload) => void | Promise<void>;
  /** Triggers the parent to navigate to the register view. */
  onToggle: () => void;
  /** Triggers the parent to navigate to the forgot-password view. */
  onForgotPassword: () => void;
  /** When true the submit button shows a loading state. */
  isLoading?: boolean;
  /** Server-side error message to display below the form. */
  serverError?: string | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * LoginForm
 *
 * Split-panel login form.
 * - Visual layer ported from auth-app's LoginForm.
 * - Business logic wired to RHF + Zod; matches LoginPayload type contract.
 * - Google OAuth and Magic Link buttons are scaffolded (not wired to backend).
 */
export function LoginForm({ onSubmit, onToggle, onForgotPassword, isLoading = false, serverError }: LoginFormProps) {
  const { t } = useTranslation();

  const loginSchema = z.object({
    email_or_username: z.string().min(1, t('auth.credentialRequired')),
    password: z.string().min(8, t('auth.passwordMin')),
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
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('auth.pageTitle', 'Sign in')}</h1>
        <p className={styles.subtitle}>
          {t('auth.welcomeBack', 'Welcome back — enter your credentials below.')}
        </p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Email / username */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="email_or_username">
            {t('auth.credentialLabel', 'Email or Username')}
          </label>
          <div className={styles.inputWrapper}>
            <Mail className={styles.inputIcon} aria-hidden="true" />
            <input
              id="email_or_username"
              type="text"
              autoComplete="username"
              placeholder="your@email.com"
              className={`${styles.input} ${errors.email_or_username ? styles.inputError : ''}`}
              {...register('email_or_username')}
            />
          </div>
          {errors.email_or_username && (
            <p className={styles.fieldError} role="alert">
              {errors.email_or_username.message as string}
            </p>
          )}
        </div>

        {/* Password */}
        <div className={styles.fieldGroup}>
          <div className={styles.passwordLabelRow}>
            <label className={styles.label} htmlFor="login-password">
              {t('auth.passwordLabel', 'Password')}
            </label>
            <button type="button" onClick={onForgotPassword} className={styles.forgotLink}>
              {t('auth.forgotPassword', 'Forgot password?')}
            </button>
          </div>
          <div className={styles.inputWrapper}>
            <Lock className={styles.inputIcon} aria-hidden="true" />
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
              {...register('password')}
            />
          </div>
          {errors.password && (
            <p className={styles.fieldError} role="alert">
              {errors.password.message as string}
            </p>
          )}
        </div>

        {serverError && (
          <p className={styles.serverError} role="alert">{serverError}</p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          aria-busy={isLoading}
          className={styles.submitBtn}
        >
          {isLoading ? t('auth.loading', 'Signing in…') : t('auth.submit', 'Sign In')}
          {!isLoading && <ArrowRight aria-hidden="true" />}
        </button>
      </form>

      {/* Divider */}
      <div className={styles.divider} role="separator">
        <span>{t('auth.orContinueWith', 'Or continue with')}</span>
      </div>

      {/* Third-party buttons — scaffolded; not wired to backend */}
      <div className={styles.socialRow}>
        <button
          type="button"
          className={styles.socialBtn}
          aria-disabled="true"
          title={t('auth.googleComingSoon', 'Google sign-in coming soon')}
        >
          <svg aria-hidden="true" className={styles.googleIcon} viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <span>{t('auth.google', 'Google')}</span>
        </button>
        <button
          type="button"
          className={styles.socialBtn}
          aria-disabled="true"
          title={t('auth.magicLinkComingSoon', 'Magic Link coming soon')}
        >
          <Wand2 aria-hidden="true" className={styles.magicIcon} />
          <span>{t('auth.magicLink', 'Magic Link')}</span>
        </button>
      </div>

      <p className={styles.togglePrompt}>
        {t('auth.newUser', 'New here?')}{' '}
        <button type="button" onClick={onToggle} className={styles.toggleLink}>
          {t('auth.createAccount', 'Create an account')}
        </button>
      </p>
    </div>
  );
}
