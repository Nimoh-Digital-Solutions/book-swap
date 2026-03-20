import { z } from 'zod';

// ---------------------------------------------------------------------------
// Auth schemas
// ---------------------------------------------------------------------------

/** Login form validation schema. */
export const loginSchema = z.object({
  email_or_username: z.string().min(1, 'Email or username is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

/** Registration form validation schema. */
export const registerSchema = z
  .object({
    username: z.string().min(3, 'Username must be at least 3 characters').max(30),
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
    first_name: z.string().min(1, 'First name is required').max(50),
    last_name: z.string().min(1, 'Last name is required').max(50),
    display_name: z.string().max(100).optional(),
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
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

// ---------------------------------------------------------------------------
// Add domain-specific schemas below
// ---------------------------------------------------------------------------
// Example:
//
// export const itemSchema = z.object({
//   name: z.string().min(1, 'Name is required').max(100),
//   description: z.string().max(500).optional(),
// });
// export type ItemFormValues = z.infer<typeof itemSchema>;
