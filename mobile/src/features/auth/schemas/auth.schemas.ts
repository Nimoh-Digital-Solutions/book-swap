import { z } from 'zod';

export const loginSchema = z.object({
  email_or_username: z.string().min(1, 'Required'),
  password: z.string().min(1, 'Required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    first_name: z.string().min(1, 'Required'),
    last_name: z.string().min(1, 'Required'),
    username: z
      .string()
      .min(3, 'At least 3 characters')
      .max(30, 'At most 30 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores'),
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'At least 8 characters'),
    password_confirm: z.string().min(1, 'Required'),
    terms_accepted: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the terms to register' }),
    }),
  })
  .refine((d) => d.password === d.password_confirm, {
    message: 'Passwords do not match',
    path: ['password_confirm'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
