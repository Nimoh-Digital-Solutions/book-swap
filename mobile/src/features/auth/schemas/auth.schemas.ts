import type { TFunction } from 'i18next';
import { z } from 'zod';

export function createLoginSchema(t: TFunction) {
  return z.object({
    email_or_username: z.string().min(1, t('validation.required', 'Required')),
    password: z.string().min(1, t('validation.required', 'Required')),
  });
}

export type LoginInput = z.infer<ReturnType<typeof createLoginSchema>>;

export function createRegisterSchema(t: TFunction) {
  return z
    .object({
      first_name: z.string().min(1, t('validation.required', 'Required')),
      last_name: z.string().min(1, t('validation.required', 'Required')),
      username: z
        .string()
        .min(3, t('validation.usernameMin', 'At least 3 characters'))
        .max(30, t('validation.usernameMax', 'At most 30 characters'))
        .regex(/^[a-zA-Z0-9_]+$/, t('validation.usernamePattern', 'Only letters, numbers, and underscores')),
      email: z.string().email(t('validation.invalidEmail', 'Invalid email')),
      password: z.string().min(8, t('validation.passwordMin', 'At least 8 characters')),
      password_confirm: z.string().min(1, t('validation.required', 'Required')),
      terms_accepted: z
        .boolean()
        .refine((v) => v === true, {
          message: t('validation.mustAcceptTerms', 'You must accept the terms to register'),
        }),
    })
    .refine((d) => d.password === d.password_confirm, {
      message: t('validation.passwordsMismatch', 'Passwords do not match'),
      path: ['password_confirm'],
    });
}

export type RegisterInput = z.infer<ReturnType<typeof createRegisterSchema>>;

export function createForgotPasswordSchema(t: TFunction) {
  return z.object({
    email: z.string().email(t('validation.invalidEmail', 'Invalid email')),
  });
}

export type ForgotPasswordInput = z.infer<ReturnType<typeof createForgotPasswordSchema>>;

export function createPasswordResetConfirmSchema(t: TFunction) {
  return z
    .object({
      password: z
        .string()
        .min(8, t('validation.passwordMin', 'At least 8 characters'))
        .regex(/[A-Z]/, t('validation.passwordUppercase', 'Must contain an uppercase letter'))
        .regex(/[a-z]/, t('validation.passwordLowercase', 'Must contain a lowercase letter'))
        .regex(/[0-9]/, t('validation.passwordDigit', 'Must contain a digit')),
      password_confirm: z.string().min(1, t('validation.required', 'Required')),
    })
    .refine((d) => d.password === d.password_confirm, {
      message: t('validation.passwordsMismatch', 'Passwords do not match'),
      path: ['password_confirm'],
    });
}

export type PasswordResetConfirmInput = z.infer<ReturnType<typeof createPasswordResetConfirmSchema>>;
