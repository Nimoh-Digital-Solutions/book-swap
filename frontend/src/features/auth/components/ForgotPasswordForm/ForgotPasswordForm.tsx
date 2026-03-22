import type { FieldValues, Resolver } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { ArrowLeft, Mail } from 'lucide-react';
import { z } from 'zod';

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
  onSubmit: (email: string) => void | Promise<void>;
  onBack: () => void;
  isLoading?: boolean;
  serverError?: string | null;
  isSuccess?: boolean;
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
// Component — "The Archival Naturalist" dark-theme forgot password
// ---------------------------------------------------------------------------

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
      <div className="flex flex-col items-center text-center gap-4 py-8" role="status" aria-live="polite">
        <div className="text-5xl" aria-hidden="true">✉️</div>
        <h1 className="text-2xl font-extrabold text-white">
          {t('auth.forgotPassword.successTitle', 'Check your email')}
        </h1>
        <p className="text-text-secondary max-w-[22rem]">
          {t('auth.forgotPassword.successBody', 'We sent a reset link to')}{' '}
          <strong className="text-white">{submittedEmail}</strong>.{' '}
          {t(
            'auth.forgotPassword.successHint',
            "It may take a minute to arrive. Don't forget to check your spam folder.",
          )}
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 text-sm font-medium text-[#E4B643] hover:underline inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {t('auth.forgotPassword.backToLogin', 'Back to Login')}
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-6 text-sm font-medium text-[#E4B643] hover:underline inline-flex items-center gap-1"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        {t('auth.forgotPassword.backToLogin', 'Back to Login')}
      </button>

      <h1 className="text-3xl font-bold text-white mb-2">
        {t('auth.forgotPassword.title', 'Forgot Password?')}
      </h1>
      <p className="text-text-secondary mb-8">
        {t(
          'auth.forgotPassword.subtitle',
          "Enter your email and we'll send you instructions to reset your password.",
        )}
      </p>

      <form
        className="space-y-5"
        onSubmit={handleSubmit(({ email }) => onSubmit(email))}
        noValidate
      >
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1" htmlFor="fp-email">
            {t('auth.forgotPassword.emailLabel', 'Email Address')}
          </label>
          <div className="relative">
            <input
              id="fp-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={`block w-full pl-10 pr-3 py-3 border rounded-xl sm:text-sm bg-[#152018] text-white placeholder-[#5A6A60] transition-colors focus:ring-[#E4B643] focus:border-[#E4B643] ${
                errors.email ? 'border-red-500' : 'border-[#28382D]'
              }`}
              {...register('email')}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="text-text-muted w-5 h-5" aria-hidden="true" />
            </div>
          </div>
          {errors.email && (
            <p className="mt-1 text-xs text-red-400" role="alert">{errors.email.message}</p>
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
            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-[#152018] bg-[#E4B643] hover:bg-[#d9b93e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E4B643] transition-colors disabled:opacity-60"
          >
            {isLoading
              ? t('auth.forgotPassword.loading', 'Sending…')
              : t('auth.forgotPassword.submit', 'Send Reset Link')}
          </button>
        </div>
      </form>
    </div>
  );
}
