import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { API } from '@configs/apiEndpoints';
import { useAppStore } from '@data/useAppStore';
import { http } from '@services';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const schema = z
  .object({
    old_password: z.string().min(1, 'Current password is required'),
    new_password1: z.string().min(8, 'New password must be at least 8 characters'),
    new_password2: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((d) => d.new_password1 === d.new_password2, {
    message: 'Passwords do not match',
    path: ['new_password2'],
  });

type FormValues = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// Password field with visibility toggle
// ---------------------------------------------------------------------------
function PasswordInput({
  id,
  label,
  value,
  onChange,
  error,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string | undefined;
  autoComplete: string;
}): ReactElement {
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-[#8C9C92]">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="w-full bg-[#152018] border border-[#28382D] rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder-[#8C9C92] focus:outline-none focus:border-[#E4B643]"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-3 flex items-center text-[#8C9C92] hover:text-white"
        >
          {visible ? (
            <EyeOff className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Eye className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section component
// ---------------------------------------------------------------------------
export function PasswordChangeSection(): ReactElement {
  const { t } = useTranslation();
  const addNotification = useAppStore((s) => s.addNotification);

  const [values, setValues] = useState<FormValues>({
    old_password: '',
    new_password1: '',
    new_password2: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (field: keyof FormValues) => (v: string) =>
    setValues((prev) => ({ ...prev, [field]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const result = schema.safeParse(values);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormValues, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FormValues;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    setLoading(true);
    try {
      await http.post(API.auth.passwordChange, result.data);
      addNotification(
        t('settings.passwordChange.success', 'Password changed successfully!'),
        { variant: 'success' },
      );
      setValues({ old_password: '', new_password1: '', new_password2: '' });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : t('settings.passwordChange.error', 'Failed to change password. Check your current password and try again.');
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1A251D] rounded-2xl border border-[#28382D] p-6 space-y-4">
      <div className="flex items-center gap-2">
        <KeyRound className="w-5 h-5 text-[#E4B643]" aria-hidden="true" />
        <h2 className="text-lg font-bold text-white">
          {t('settings.passwordChange.heading', 'Change Password')}
        </h2>
      </div>

      <form onSubmit={(e) => { void handleSubmit(e); }} noValidate className="space-y-4">
        <PasswordInput
          id="old_password"
          label={t('settings.passwordChange.currentPassword', 'Current password')}
          value={values.old_password}
          onChange={set('old_password')}
          error={errors.old_password}
          autoComplete="current-password"
        />
        <PasswordInput
          id="new_password1"
          label={t('settings.passwordChange.newPassword', 'New password')}
          value={values.new_password1}
          onChange={set('new_password1')}
          error={errors.new_password1}
          autoComplete="new-password"
        />
        <PasswordInput
          id="new_password2"
          label={t('settings.passwordChange.confirmPassword', 'Confirm new password')}
          value={values.new_password2}
          onChange={set('new_password2')}
          error={errors.new_password2}
          autoComplete="new-password"
        />

        {serverError && (
          <p role="alert" className="text-sm text-red-400">
            {serverError}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-[#E4B643] text-[#152018] hover:bg-[#D4A633] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading
            ? t('common.saving', 'Saving…')
            : t('settings.passwordChange.submit', 'Change Password')}
        </button>
      </form>
    </div>
  );
}
