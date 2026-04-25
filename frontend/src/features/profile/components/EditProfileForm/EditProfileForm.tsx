import { type ReactElement, useCallback, useState } from 'react';
import type { FieldValues, Resolver } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useAppStore } from '@data/useAppStore';
import { useScrollIntoViewOnFocus } from '@hooks';
import { AlertCircle, Check, Loader2, Save } from 'lucide-react';
import { z } from 'zod';

import { useCheckUsername } from '../../hooks/useCheckUsername';
import { useUpdateProfile } from '../../hooks/useUpdateProfile';
import { profileEditSchema } from '../../schemas/profile.schemas';
import type { UserProfile } from '../../types/profile.types';
import { AvatarUpload } from '../AvatarUpload';
import { GenrePicker } from '../GenrePicker';

// ---------------------------------------------------------------------------
// Zod resolver (same lightweight pattern as auth forms)
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
export interface EditProfileFormProps {
  profile: UserProfile;
  onSuccess?: () => void;
}

type FormValues = z.infer<typeof profileEditSchema>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function EditProfileForm({ profile, onSuccess }: EditProfileFormProps): ReactElement {
  const { t } = useTranslation();
  const updateProfile = useUpdateProfile();
  const addNotification = useAppStore(s => s.addNotification);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: makeZodResolver(profileEditSchema),
    mode: 'onTouched',
    defaultValues: {
      first_name: profile.first_name,
      last_name: profile.last_name,
      bio: profile.bio || '',
      preferred_genres: profile.preferred_genres,
      preferred_language: profile.preferred_language,
      preferred_radius: profile.preferred_radius,
    },
  });

  // Username availability check (not part of RHF — separate controlled input)
  const [usernameInput, setUsernameInput] = useState(profile.username);
  const { data: usernameCheck, isLoading: isCheckingUsername } = useCheckUsername(
    usernameInput,
    profile.username,
  );

  const bioValue = watch('bio') ?? '';

  const onSubmit = useCallback(
    (values: FormValues) => {
      const payload: Record<string, unknown> = { ...values };

      // Only send username if changed
      if (usernameInput !== profile.username) {
        if (usernameCheck && !usernameCheck.available) return;
        payload.username = usernameInput;
      }

      // Avatar handled via FormData
      if (avatarFile) {
        payload.avatar = avatarFile;
      }

      updateProfile.mutate(payload as never, {
        onSuccess: () => {
          addNotification(
            t('profile.edit.success', 'Profile updated successfully!'),
            { variant: 'success' },
          );
          onSuccess?.();
        },
      });
    },
    [usernameInput, profile.username, usernameCheck, avatarFile, updateProfile, addNotification, t, onSuccess],
  );

  const inputBase =
    'block w-full px-3 py-3 border rounded-xl text-base sm:text-sm bg-[#152018] text-white placeholder-[#5A6A60] transition-colors focus:ring-[#E4B643] focus:border-[#E4B643]';

  const usernameChanged = usernameInput.toLowerCase() !== profile.username.toLowerCase();

  // RESP-035 (Sprint C).
  const formRef = useScrollIntoViewOnFocus<HTMLFormElement>();

  return (
    <form ref={formRef} className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Avatar */}
      <AvatarUpload
        currentAvatar={profile.avatar}
        displayName={profile.first_name}
        onFile={setAvatarFile}
      />

      {/* Username */}
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-[#8C9C92] mb-1">
          {t('profile.edit.usernameLabel', 'Username')}
        </label>
        <div className="relative">
          <input
            id="username"
            type="text"
            value={usernameInput}
            onChange={e => setUsernameInput(e.target.value)}
            className={`${inputBase} pr-10 ${
              usernameChanged && usernameCheck && !usernameCheck.available
                ? 'border-red-500'
                : usernameChanged && usernameCheck?.available
                  ? 'border-green-500'
                  : 'border-[#28382D]'
            }`}
            autoComplete="username"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {isCheckingUsername && (
              <Loader2 className="w-4 h-4 text-[#5A6A60] animate-spin" aria-hidden="true" />
            )}
            {!isCheckingUsername && usernameChanged && usernameCheck?.available && (
              <Check className="w-4 h-4 text-green-400" aria-hidden="true" />
            )}
            {!isCheckingUsername && usernameChanged && usernameCheck && !usernameCheck.available && (
              <AlertCircle className="w-4 h-4 text-red-400" aria-hidden="true" />
            )}
          </div>
        </div>
        {usernameChanged && usernameCheck && !usernameCheck.available && (
          <p className="mt-1 text-sm text-red-400" role="alert">
            {t('profile.edit.usernameTaken', 'This username is taken.')}
            {usernameCheck.suggestions && usernameCheck.suggestions.length > 0 && (
              <span className="block text-[#8C9C92] mt-1">
                {t('profile.edit.usernameSuggestions', 'Try: {{suggestions}}', {
                  suggestions: usernameCheck.suggestions.join(', '),
                })}
              </span>
            )}
          </p>
        )}
      </div>

      {/* Name row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-[#8C9C92] mb-1">
            {t('profile.edit.firstNameLabel', 'First Name')}
          </label>
          <input
            id="first_name"
            type="text"
            className={`${inputBase} ${errors.first_name ? 'border-red-500' : 'border-[#28382D]'}`}
            {...register('first_name')}
          />
          {errors.first_name && (
            <p className="mt-1 text-sm text-red-400" role="alert">{errors.first_name.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="last_name" className="block text-sm font-medium text-[#8C9C92] mb-1">
            {t('profile.edit.lastNameLabel', 'Last Name')}
          </label>
          <input
            id="last_name"
            type="text"
            className={`${inputBase} ${errors.last_name ? 'border-red-500' : 'border-[#28382D]'}`}
            {...register('last_name')}
          />
          {errors.last_name && (
            <p className="mt-1 text-sm text-red-400" role="alert">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-[#8C9C92] mb-1">
          {t('profile.edit.bioLabel', 'Bio')}
          <span className="ml-2 text-xs text-[#5A6A60]">
            ({bioValue.length}/300)
          </span>
        </label>
        <textarea
          id="bio"
          rows={3}
          maxLength={300}
          className={`${inputBase} resize-none ${errors.bio ? 'border-red-500' : 'border-[#28382D]'}`}
          placeholder={t('profile.edit.bioPlaceholder', 'Tell others about your reading interests…')}
          {...register('bio')}
        />
        {errors.bio && (
          <p className="mt-1 text-sm text-red-400" role="alert">{errors.bio.message}</p>
        )}
      </div>

      {/* Genre picker */}
      <Controller
        name="preferred_genres"
        control={control}
        render={({ field }) => (
          <GenrePicker
            value={field.value ?? []}
            onChange={field.onChange}
            error={errors.preferred_genres?.message}
          />
        )}
      />

      {/* Preferred language */}
      <div>
        <label htmlFor="preferred_language" className="block text-sm font-medium text-[#8C9C92] mb-1">
          {t('profile.edit.languageLabel', 'Preferred Language')}
        </label>
        <select
          id="preferred_language"
          className={`${inputBase} border-[#28382D]`}
          {...register('preferred_language')}
        >
          <option value="en">English</option>
          <option value="nl">Nederlands</option>
          <option value="both">Both / Beide</option>
        </select>
      </div>

      {/* Preferred radius */}
      <div>
        <label htmlFor="preferred_radius" className="block text-sm font-medium text-[#8C9C92] mb-1">
          {t('profile.edit.radiusLabel', 'Search Radius')}
          <span className="ml-2 text-xs text-[#5A6A60]">
            ({watch('preferred_radius') ? `${((watch('preferred_radius') ?? 0) / 1000).toFixed(1)} km` : '—'})
          </span>
        </label>
        <input
          id="preferred_radius"
          type="range"
          min={500}
          max={50000}
          step={500}
          className="w-full accent-[#E4B643]"
          {...register('preferred_radius', { valueAsNumber: true })}
        />
        <div className="flex justify-between text-xs text-[#5A6A60]">
          <span>500m</span>
          <span>50km</span>
        </div>
        {errors.preferred_radius && (
          <p className="mt-1 text-sm text-red-400" role="alert">{errors.preferred_radius.message}</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={updateProfile.isPending || (!isDirty && !avatarFile && !usernameChanged)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-colors bg-[#E4B643] text-[#152018] hover:bg-[#d9b93e] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {updateProfile.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        ) : (
          <Save className="w-4 h-4" aria-hidden="true" />
        )}
        {t('profile.edit.save', 'Save Changes')}
      </button>

      {updateProfile.isError && (
        <p className="text-sm text-red-400 text-center" role="alert">
          {t('profile.edit.error', 'Failed to update profile. Please try again.')}
        </p>
      )}
    </form>
  );
}
