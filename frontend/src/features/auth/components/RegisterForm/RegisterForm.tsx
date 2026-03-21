import { useState } from 'react';
import type { FieldValues, Resolver } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { ArrowRight, Lock, Mail, User, Users } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { z } from 'zod';

import type { RegisterPayload } from '../../types/auth.types';

import styles from './RegisterForm.module.scss';

// ---------------------------------------------------------------------------
// Inline Zod resolver (same pattern as LoginForm)
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
  /** Called with validated form data on successful submission. */
  onSubmit: (payload: RegisterPayload) => void | Promise<void>;
  /** Triggers the parent to navigate to the login view. */
  onToggle: () => void;
  /** When true the submit button shows a loading state. */
  isLoading?: boolean;
  /** Server-side error message to display below the form. */
  serverError?: string | null;
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const registerSchema = z
  .object({
    first_name: z.string().min(1, 'First name is required').max(50),
    last_name: z.string().min(1, 'Last name is required').max(50),
    username: z.string().min(3, 'Username must be at least 3 characters').max(30),
    email: z.string().email('Please enter a valid email address'),
    display_name: z.string().max(100).optional(),
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
// Component
// ---------------------------------------------------------------------------

/**
 * RegisterForm
 *
 * Split-panel registration form.
 * - Visual layer ported from auth-app's RegisterForm (role toggle, animated field reveal)
 * - Business logic wired to RHF + Zod; matches RegisterPayload type contract.
 * - Role toggle is cosmetic (shows/hides display_name field), not sent in payload.
 */
export function RegisterForm({ onSubmit, onToggle, isLoading = false, serverError }: RegisterFormProps) {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [role, setRole] = useState<'member' | 'leader'>('member');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: makeZodResolver(registerSchema),
    mode: 'onTouched',
  });

  const handleFormSubmit = (values: RegisterFormValues) => {
    // Strip the role (UI-only) and the re-typed password confirm from the payload
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
    if (values.display_name) payload.display_name = values.display_name;
    void onSubmit(payload);
  };

  const fieldRevealProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, height: 0, marginTop: 0 },
        animate: { opacity: 1, height: 'auto', marginTop: 16 },
        exit: { opacity: 0, height: 0, marginTop: 0 },
        transition: { duration: 0.3, ease: 'easeInOut' as const },
      };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('auth.register.heading', 'Create your account')}</h1>
        <p className={styles.subtitle}>
          {t('auth.register.subtitle', 'Get started today — it only takes a minute.')}
        </p>
      </div>

      {/* Role toggle */}
      <div className={styles.roleToggle} role="group" aria-label={t('auth.register.roleLabel', 'Account type')}>
        <button
          type="button"
          className={`${styles.roleBtn} ${role === 'member' ? styles.roleBtnActive : ''}`}
          onClick={() => setRole('member')}
          aria-pressed={role === 'member'}
        >
          {role === 'member' && (
            <motion.div
              layoutId="activeRole"
              className={styles.roleIndicator}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className={styles.roleBtnLabel}>
            {t('auth.register.roleMember', 'Looking for a group')}
          </span>
        </button>
        <button
          type="button"
          className={`${styles.roleBtn} ${role === 'leader' ? styles.roleBtnActive : ''}`}
          onClick={() => setRole('leader')}
          aria-pressed={role === 'leader'}>
          {role === 'leader' && (
            <motion.div
              layoutId="activeRole"
              className={styles.roleIndicator}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className={styles.roleBtnLabel}>
            {t('auth.register.roleLeader', 'Want to lead')}
          </span>
        </button>
      </div>

      <form className={styles.form} onSubmit={handleSubmit(handleFormSubmit)} noValidate>
        {/* Name row */}
        <div className={styles.nameRow}>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="first_name">
              {t('auth.register.firstNameLabel', 'First Name')}
            </label>
            <div className={styles.inputWrapper}>
              <User className={styles.inputIcon} aria-hidden="true" />
              <input
                id="first_name"
                type="text"
                autoComplete="given-name"
                placeholder="Jane"
                className={`${styles.input} ${errors.first_name ? styles.inputError : ''}`}
                {...register('first_name')}
              />
            </div>
            {errors.first_name && (
              <p className={styles.fieldError} role="alert">{errors.first_name.message}</p>
            )}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="last_name">
              {t('auth.register.lastNameLabel', 'Last Name')}
            </label>
            <div className={styles.inputWrapper}>
              <User className={styles.inputIcon} aria-hidden="true" />
              <input
                id="last_name"
                type="text"
                autoComplete="family-name"
                placeholder="Doe"
                className={`${styles.input} ${errors.last_name ? styles.inputError : ''}`}
                {...register('last_name')}
              />
            </div>
            {errors.last_name && (
              <p className={styles.fieldError} role="alert">{errors.last_name.message}</p>
            )}
          </div>
        </div>

        {/* Username */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="username">
            {t('auth.register.usernameLabel', 'Username')}
          </label>
          <div className={styles.inputWrapper}>
            <User className={styles.inputIcon} aria-hidden="true" />
            <input
              id="username"
              type="text"
              autoComplete="username"
              placeholder="janedoe"
              className={`${styles.input} ${errors.username ? styles.inputError : ''}`}
              {...register('username')}
            />
          </div>
          {errors.username && (
            <p className={styles.fieldError} role="alert">{errors.username.message}</p>
          )}
        </div>

        {/* Email */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="reg-email">
            {t('auth.register.emailLabel', 'Email Address')}
          </label>
          <div className={styles.inputWrapper}>
            <Mail className={styles.inputIcon} aria-hidden="true" />
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              placeholder="your@email.com"
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className={styles.fieldError} role="alert">{errors.email.message}</p>
          )}
        </div>

        {/* Display name (conditionally revealed for group leaders) */}
        <AnimatePresence initial={false}>
          {role === 'leader' && (
            <motion.div className={`${styles.fieldGroup} ${styles.overflow}`} {...fieldRevealProps}>
              <label className={styles.label} htmlFor="display_name">
                {t('auth.register.displayNameLabel', 'Small Group Name')}
                <span className={styles.optional}> ({t('common.optional', 'optional')})</span>
              </label>
              <div className={styles.inputWrapper}>
                <Users className={styles.inputIcon} aria-hidden="true" />
                <input
                  id="display_name"
                  type="text"
                  placeholder="e.g. Downtown Young Adults"
                  className={styles.input}
                  {...register('display_name')}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Password */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="reg-password">
            {t('auth.passwordLabel', 'Password')}
          </label>
          <div className={styles.inputWrapper}>
            <Lock className={styles.inputIcon} aria-hidden="true" />
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
              {...register('password')}
            />
          </div>
          {errors.password && (
            <p className={styles.fieldError} role="alert">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm password */}
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="password_confirm">
            {t('auth.register.confirmPasswordLabel', 'Confirm Password')}
          </label>
          <div className={styles.inputWrapper}>
            <Lock className={styles.inputIcon} aria-hidden="true" />
            <input
              id="password_confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className={`${styles.input} ${errors.password_confirm ? styles.inputError : ''}`}
              {...register('password_confirm')}
            />
          </div>
          {errors.password_confirm && (
            <p className={styles.fieldError} role="alert">{errors.password_confirm.message}</p>
          )}
        </div>

        {/* Legal checkboxes */}
        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" className={styles.checkbox} {...register('privacy_policy_accepted')} />
            <span>
              {t('auth.register.privacyAccept', 'I accept the')}{' '}
              <button type="button" className={styles.legalLink}>{t('auth.register.privacyPolicy', 'Privacy Policy')}</button>
            </span>
          </label>
          {errors.privacy_policy_accepted && (
            <p className={styles.fieldError} role="alert">{errors.privacy_policy_accepted.message}</p>
          )}

          <label className={styles.checkboxLabel}>
            <input type="checkbox" className={styles.checkbox} {...register('terms_of_service_accepted')} />
            <span>
              {t('auth.register.termsAccept', 'I accept the')}{' '}
              <button type="button" className={styles.legalLink}>{t('auth.register.termsOfService', 'Terms of Service')}</button>
            </span>
          </label>
          {errors.terms_of_service_accepted && (
            <p className={styles.fieldError} role="alert">{errors.terms_of_service_accepted.message}</p>
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
            ? t('auth.loading', 'Creating account…')
            : t('auth.register.submit', 'Create Account')}
          {!isLoading && <ArrowRight aria-hidden="true" />}
        </button>
      </form>

      <p className={styles.togglePrompt}>
        {t('auth.register.alreadyHaveAccount', 'Already have an account?')}{' '}
        <button type="button" onClick={onToggle} className={styles.toggleLink}>
          {t('auth.signIn', 'Sign in')}
        </button>
      </p>
    </div>
  );
}
