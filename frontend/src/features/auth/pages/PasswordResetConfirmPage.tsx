import { type ReactElement, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useDocumentTitle } from '@hooks';
import { PATHS, routeMetadata } from '@routes/config/paths';
import { HttpError } from '@services';
import { AlertCircle, CheckCircle, Lock } from 'lucide-react';

import { authService } from '../services/auth.service';

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/\d/, 'Must contain at least one number'),
    password_confirm: z.string().min(1, 'Please confirm your password'),
  })
  .refine(data => data.password === data.password_confirm, {
    message: 'Passwords do not match',
    path: ['password_confirm'],
  });

type FormData = z.infer<typeof schema>;

type PageState = 'form' | 'success' | 'error';

const inputBase =
  'block w-full pl-10 pr-3 py-3 border rounded-xl sm:text-sm bg-[#152018] text-white placeholder-[#5A6A60] transition-colors focus:ring-[#E4B643] focus:border-[#E4B643]';

/**
 * PasswordResetConfirmPage — /password-reset/confirm?uid=<uid>&token=<token>
 *
 * Landing page when the user clicks the password-reset link in their email.
 * Shows a form to set a new password, then calls the reset-confirm endpoint.
 */
export function PasswordResetConfirmPage(): ReactElement {
  const [searchParams] = useSearchParams();
  const [pageState, setPageState] = useState<PageState>(() => {
    const uid = searchParams.get('uid');
    const token = searchParams.get('token');
    return uid && token ? 'form' : 'error';
  });
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useDocumentTitle(routeMetadata[PATHS.PASSWORD_RESET_CONFIRM].title);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    const uid = searchParams.get('uid');
    const token = searchParams.get('token');
    if (!uid || !token) return;

    setIsLoading(true);
    setServerError('');
    try {
      await authService.confirmPasswordReset(uid, token, data.password);
      setPageState('success');
    } catch (err) {
      if (err instanceof HttpError) {
        const body = err.body as Record<string, unknown> | null;
        const detail = body?.detail;
        if (typeof detail === 'string') {
          setServerError(detail);
        } else {
          setServerError('This reset link is invalid or has expired. Please request a new one.');
        }
      } else {
        setServerError('Something went wrong. Please try again.');
      }
      setPageState('error');
    } finally {
      setIsLoading(false);
    }
  };

  const uid = searchParams.get('uid');
  const token = searchParams.get('token');
  const missingParams = !uid || !token;

  return (
    <main className="min-h-screen bg-[#152018] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* ── Form state ── */}
        {pageState === 'form' && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-white">Set New Password</h1>
              <p className="text-[#8C9C92]">
                Choose a new password for your account.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {/* New Password */}
              <div>
                <label
                  className="block text-sm font-medium text-[#8C9C92] mb-1"
                  htmlFor="reset-password"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="reset-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className={`${inputBase} ${errors.password ? 'border-red-500' : 'border-[#28382D]'}`}
                    {...register('password')}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="text-[#5A6A60] w-5 h-5" aria-hidden="true" />
                  </div>
                </div>
                <p className="mt-1 text-xs text-[#5A6A60]">
                  Min 8 characters with uppercase, lowercase, and a number.
                </p>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-400" role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  className="block text-sm font-medium text-[#8C9C92] mb-1"
                  htmlFor="reset-password-confirm"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="reset-password-confirm"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className={`${inputBase} ${errors.password_confirm ? 'border-red-500' : 'border-[#28382D]'}`}
                    {...register('password_confirm')}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="text-[#5A6A60] w-5 h-5" aria-hidden="true" />
                  </div>
                </div>
                {errors.password_confirm && (
                  <p className="mt-1 text-xs text-red-400" role="alert">
                    {errors.password_confirm.message}
                  </p>
                )}
              </div>

              {serverError && pageState === 'form' && (
                <p className="text-sm text-red-400" role="alert">
                  {serverError}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-[#E4B643] text-[#152018] font-semibold hover:bg-[#d4a43a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Resetting…' : 'Reset Password'}
              </button>
            </form>
          </div>
        )}

        {/* ── Success state ── */}
        {pageState === 'success' && (
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-900/30 border border-green-700/40">
              <CheckCircle className="w-8 h-8 text-green-400" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold text-white">Password Reset!</h1>
            <p className="text-[#8C9C92]">
              Your password has been updated. You can now sign in with your new password.
            </p>
            <Link
              to={PATHS.LOGIN}
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#E4B643] text-[#152018] font-semibold hover:bg-[#d4a43a] transition-colors"
            >
              Sign in
            </Link>
          </div>
        )}

        {/* ── Error state ── */}
        {pageState === 'error' && (
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-900/30 border border-red-700/40">
              <AlertCircle className="w-8 h-8 text-red-400" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold text-white">Reset Failed</h1>
            <p className="text-[#8C9C92]" role="alert">
              {missingParams
                ? 'Invalid reset link. Please check the link in your email or request a new one.'
                : serverError || 'This reset link is invalid or has expired.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to={PATHS.LOGIN}
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#1A251D] border border-[#28382D] text-white font-semibold hover:bg-[#28382D] transition-colors"
              >
                Sign in
              </Link>
              <Link
                to={PATHS.FORGOT_PASSWORD}
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#E4B643] text-[#152018] font-semibold hover:bg-[#d4a43a] transition-colors"
              >
                Request a new link
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
