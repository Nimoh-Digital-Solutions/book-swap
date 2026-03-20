import type { FieldValues, Resolver } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { ArrowLeft, Mail } from 'lucide-react';
import { z } from 'zod';

import styles from './ForgotPasswordForm.module.scss';

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
      if (!errors[key]) errors[key] = { type: issue.code, message: issue.message };
    }
    return { errors: errors as never, values: {} as never };
  };
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface ForgotPasswordFormProps {
  /** Called with the validated email on submission. */
  onSubmit: (email: string) => void | Promise<void>;
  /** Navigates back to the login view. */
  onBack: () => void;
  /** When true the submit button shows a loading state. */
  isLoading?: boolean;
  /** Server-side error message. */
  serverError?: string | null;
  /** When true the success confirmation panel is shown instead of the form. */
  isSuccess?: boolean;
  /** The email that was submitted — shown in the success message. */
  submittedEmail?: string;
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});
type FormValues = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * ForgotPasswordForm
 *
 * Single-field email form that requests a password reset link.
 * Renders a success confirmation panel when `isSuccess` is true.
 */
export function ForgotPasswordForm({
  onSubmit,
  onBack,
  isLoading = false,
  serverError,
  isSuccess = false,
  submittedEmail,
}: ForgotPasswordFormProps) {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: makeZodResolver(schema), mode: 'onTouched' });

  if (isSuccess) {
    return (
      <div className={styles.successPanel} role="status" aria-live="polite">
        <div className={styles.successIcon} aria-hidden="true">✉️</div>
        <h1 className={styles.successTitle}>
          {t('auth.forgotPassword.successTitle', 'Check your email')}
        </h1>
        <p className={styles.successBody}>
          {t('auth.forgotPassword.successBody', 'We sent a reset link to')}{' '}
          <strong>{submittedEmail}</strong>.{' '}
          {t('auth.forgotPassword.successHint', "It may take a minute to arrive. Don't forget to check your spam folder.")}
        </p>
      </div>
    );
  }

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit(({ email }) => onSubmit(email))}
      noValidate
    >
      <button type="button" onClick={onBack} className={styles.backBtn}>
        <ArrowLeft aria-hidden="true" />
        {t('auth.forgotPassword.backToLogin', 'Back to Login')}
      </button>

      <div className={styles.heading}>
        <h1 className={styles.title}>
          {t('auth.forgotPassword.title', 'Forgot Password?')}
        </h1>
        <p className={styles.subtitle}>
          {t('auth.forgotPassword.subtitle', "Enter your email and we'll send you instructions to reset your password.")}
        </p>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="fp-email">
          {t('auth.forgotPassword.emailLabel', 'Email Address')}
        </label>
        <div className={styles.inputWrapper}>
          <Mail className={styles.inputIcon} aria-hidden="true" />
          <input
            id="fp-email"
            type="email"
            autoComplete="email"
            placeholder="name@company.com"
            className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
            {...register('email')}
          />
        </div>
        {errors.email && (
          <p className={styles.fieldError} role="alert">{errors.email.message}</p>
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
        {isLoading
          ? t('auth.forgotPassword.loading', 'Sending…')
          : t('auth.forgotPassword.submit', 'Send Reset Link')}
      </button>
    </form>
  );
}
