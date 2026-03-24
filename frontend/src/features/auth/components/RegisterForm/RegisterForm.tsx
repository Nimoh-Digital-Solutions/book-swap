import type { FieldValues, Resolver } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { API } from '@configs/apiEndpoints';
import { APP_CONFIG } from '@configs/appConfig';
import { ArrowRight, Calendar, Lock, Mail, User } from 'lucide-react';
import { z } from 'zod';

import type { RegisterPayload } from '../../types/auth.types';

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
export interface RegisterFormProps {
  onSubmit: (payload: RegisterPayload) => void | Promise<void>;
  onToggle: () => void;
  isLoading?: boolean;
  serverError?: string | null;
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const registerSchema = z
  .object({
    first_name: z.string().max(50).optional().default(''),
    last_name: z.string().max(50).optional().default(''),
    username: z.string().min(3, 'Username must be at least 3 characters').max(30),
    email: z.string().email('Please enter a valid email address'),
    date_of_birth: z.string().min(1, 'Date of birth is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/\d/, 'Must contain at least one number'),
    password_confirm: z.string().min(1, 'Please confirm your password'),
    privacy_policy_accepted: z.literal(true, {
      message: 'You must accept the privacy policy',
    }),
    terms_of_service_accepted: z.literal(true, {
      message: 'You must accept the terms of service',
    }),
  })
  .refine(data => data.password === data.password_confirm, {
    message: 'Passwords do not match',
    path: ['password_confirm'],
  })
  .refine(
    data => {
      const dob = new Date(data.date_of_birth);
      const now = new Date();
      const age = now.getFullYear() - dob.getFullYear();
      const monthDiff = now.getMonth() - dob.getMonth();
      const dayDiff = now.getDate() - dob.getDate();
      const adjustedAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
      return adjustedAge >= 16;
    },
    {
      message: 'You must be at least 16 years old to use BookSwap',
      path: ['date_of_birth'],
    },
  );

type RegisterFormValues = z.infer<typeof registerSchema>;

// ---------------------------------------------------------------------------
// Component — "The Archival Naturalist" dark‑theme register (Step 1 of 2)
// ---------------------------------------------------------------------------

export function RegisterForm({ onSubmit, onToggle, isLoading = false, serverError }: RegisterFormProps) {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: makeZodResolver(registerSchema),
    mode: 'onTouched',
  });

  const handleFormSubmit = (values: RegisterFormValues) => {
    const payload: RegisterPayload = {
      first_name: values.first_name,
      last_name: values.last_name,
      username: values.username,
      email: values.email,
      password: values.password,
      password_confirm: values.password_confirm,
      date_of_birth: values.date_of_birth,
      privacy_policy_accepted: values.privacy_policy_accepted as boolean,
      terms_of_service_accepted: values.terms_of_service_accepted as boolean,
    };
    void onSubmit(payload);
  };

  const inputBase =
    'block w-full pl-10 pr-3 py-3 border rounded-xl sm:text-sm bg-[#152018] text-white placeholder-[#5A6A60] transition-colors focus:ring-[#E4B643] focus:border-[#E4B643]';

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <span className="uppercase tracking-widest text-xs font-bold text-text-secondary">
          {t('auth.register.step', 'Step 1 of 2')}
        </span>
        <button
          type="button"
          onClick={onToggle}
          className="text-sm font-medium text-[#E4B643] hover:underline"
        >
          {t('auth.register.alreadyMember', 'Already a member?')}
        </button>
      </div>

      <h2 className="text-3xl font-bold text-white mb-2">
        {t('auth.register.heading', 'Create Account')}
      </h2>
      <p className="text-text-secondary mb-8">
        {t('auth.register.subtitle', 'Start your reading journey in seconds.')}
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
          <span className="text-sm font-medium text-white">{t('auth.google', 'Google')}</span>
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-2 px-4 py-2.5 border border-border-dark rounded-xl bg-background-dark hover:bg-border-dark transition-colors"
          aria-disabled="true"
        >
          <svg aria-hidden="true" className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13.064 3.245c.083 1.838-1.077 3.515-2.22 4.14-1.082.59-2.61.542-3.32-.437-.767-1.055-.386-3.058.74-4.22 1.05-1.085 3.033-1.127 4.8-.517zM12.986 6.94c2.256-.254 3.733 1.258 4.256 1.638 1.488-1.083 3.03-1.01 3.597-.733.204 1.144-.64 2.45-1.637 3.692-1.22 1.517-1.11 3.284.225 5.176 1.156 1.634.355 3.525-1.074 4.137-1.23.527-2.68.32-4.103-.23-1.378-.535-2.716-.475-4.102-.036-1.554.49-3.023.76-4.39-.023-1.572-.9-2.072-2.73-1.074-4.137 1.063-1.498 1.405-3.23.366-4.996-.803-1.365-1.353-2.623-.42-3.832.613-.794 1.76-1.464 3.23-1.233.91.143 1.95.83 2.76 1.255.856.45 1.795.397 2.366-.68z" />
          </svg>
          <span className="text-sm font-medium text-white">{t('auth.apple', 'Apple')}</span>
        </button>
      </div>

      {/* Divider */}
      <div className="relative mb-8">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-border-dark" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-surface-dark text-text-secondary">
            {t('auth.orRegisterWithEmail', 'Or register with email')}
          </span>
        </div>
      </div>

      {/* Form */}
      <form className="space-y-5" onSubmit={handleSubmit(handleFormSubmit)} noValidate>
        {/* Name row */}
        {/* <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1" htmlFor="first_name">
              {t('auth.register.firstNameLabel', 'First Name')}
            </label>
            <div className="relative">
              <input
                id="first_name"
                type="text"
                autoComplete="given-name"
                placeholder="Jane"
                className={`${inputBase} ${errors.first_name ? 'border-red-500' : 'border-border-dark'}`}
                {...register('first_name')}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="text-text-muted w-5 h-5" aria-hidden="true" />
              </div>
            </div>
            {errors.first_name && (
              <p className="mt-1 text-xs text-red-400" role="alert">{errors.first_name.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1" htmlFor="last_name">
              {t('auth.register.lastNameLabel', 'Last Name')}
            </label>
            <div className="relative">
              <input
                id="last_name"
                type="text"
                autoComplete="family-name"
                placeholder="Doe"
                className={`${inputBase} ${errors.last_name ? 'border-red-500' : 'border-border-dark'}`}
                {...register('last_name')}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="text-text-muted w-5 h-5" aria-hidden="true" />
              </div>
            </div>
            {errors.last_name && (
              <p className="mt-1 text-xs text-red-400" role="alert">{errors.last_name.message}</p>
            )}
          </div>
        </div> */}

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1" htmlFor="username">
            {t('auth.register.usernameLabel', 'Username')}
          </label>
          <div className="relative">
            <input
              id="username"
              type="text"
              autoComplete="username"
              placeholder="janedoe"
              className={`${inputBase} ${errors.username ? 'border-red-500' : 'border-border-dark'}`}
              {...register('username')}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="text-text-muted w-5 h-5" aria-hidden="true" />
            </div>
          </div>
          {errors.username && (
            <p className="mt-1 text-xs text-red-400" role="alert">{errors.username.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1" htmlFor="reg-email">
            {t('auth.register.emailLabel', 'Email Address')}
          </label>
          <div className="relative">
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={`${inputBase} ${errors.email ? 'border-red-500' : 'border-border-dark'}`}
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

        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1" htmlFor="date_of_birth">
            {t('auth.register.dobLabel', 'Date of Birth')}
          </label>
          <div className="relative">
            <input
              id="date_of_birth"
              type="date"
              className={`${inputBase} ${errors.date_of_birth ? 'border-red-500' : 'border-border-dark'}`}
              {...register('date_of_birth')}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="text-text-muted w-5 h-5" aria-hidden="true" />
            </div>
          </div>
          <p className="mt-1 text-xs text-text-muted">
            {t('auth.register.dobHint', 'You must be at least 16 years old.')}
          </p>
          {errors.date_of_birth && (
            <p className="mt-1 text-xs text-red-400" role="alert">{errors.date_of_birth.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1" htmlFor="reg-password">
            {t('auth.passwordLabel', 'Password')}
          </label>
          <div className="relative">
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className={`${inputBase} ${errors.password ? 'border-red-500' : 'border-border-dark'}`}
              {...register('password')}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="text-text-muted w-5 h-5" aria-hidden="true" />
            </div>
          </div>
          <p className="mt-1 text-xs text-text-muted">
            {t('auth.register.passwordHint', 'Min 8 characters with uppercase, lowercase, and a number.')}
          </p>
          {errors.password && (
            <p className="mt-1 text-xs text-red-400" role="alert">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1" htmlFor="password_confirm">
            {t('auth.register.confirmPasswordLabel', 'Confirm Password')}
          </label>
          <div className="relative">
            <input
              id="password_confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className={`${inputBase} ${errors.password_confirm ? 'border-red-500' : 'border-border-dark'}`}
              {...register('password_confirm')}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="text-text-muted w-5 h-5" aria-hidden="true" />
            </div>
          </div>
          {errors.password_confirm && (
            <p className="mt-1 text-xs text-red-400" role="alert">{errors.password_confirm.message}</p>
          )}
        </div>

        {/* Legal checkboxes */}
        <div className="space-y-3 flex justify-between">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="terms_of_service_accepted"
                type="checkbox"
                className="h-4 w-4 text-[#E4B643] border-[#28382D] rounded bg-[#152018] focus:ring-[#E4B643] checked:bg-[#E4B643]"
                {...register('terms_of_service_accepted')}
              />
            </div>
            <div className="ml-3 text-sm">
              <label className="font-medium text-text-secondary" htmlFor="terms_of_service_accepted">
                {t('auth.register.termsAccept', 'I agree to the')}{' '}
                <button type="button" className="text-[#E4B643] hover:underline">
                  {t('auth.register.termsOfService', 'Terms of Service')}
                </button>
              </label>
            </div>
          </div>
          {errors.terms_of_service_accepted && (
            <p className="text-xs text-red-400 ml-7" role="alert">{errors.terms_of_service_accepted.message}</p>
          )}

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="privacy_policy_accepted"
                type="checkbox"
                className="h-4 w-4 text-[#E4B643] border-[#28382D] rounded bg-[#152018] focus:ring-[#E4B643] checked:bg-[#E4B643]"
                {...register('privacy_policy_accepted')}
              />
            </div>
            <div className="ml-3 text-sm">
              <label className="font-medium text-text-secondary" htmlFor="privacy_policy_accepted">
                {t('auth.register.privacyAccept', 'I accept the')}{' '}
                <button type="button" className="text-[#E4B643] hover:underline">
                  {t('auth.register.privacyPolicy', 'Privacy Policy')}
                </button>
              </label>
            </div>
          </div>
          {errors.privacy_policy_accepted && (
            <p className="text-xs text-red-400 ml-7" role="alert">{errors.privacy_policy_accepted.message}</p>
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
              ? t('auth.loading', 'Creating account…')
              : t('auth.register.submit', 'Continue to Step 2')}
            {!isLoading && <ArrowRight className="w-4 h-4" aria-hidden="true" />}
          </button>
        </div>
      </form>
    </div>
  );
}
