import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppStore } from '@data/useAppStore';
import { Shield } from 'lucide-react';

import { useProfile } from '../../hooks/useProfile';
import { useUpdateProfile } from '../../hooks/useUpdateProfile';

export function PrivacySection(): ReactElement {
  const { t } = useTranslation();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const addNotification = useAppStore((s) => s.addNotification);

  const handleToggle = () => {
    if (!profile || updateProfile.isPending) return;
    const next = !profile.profile_public;
    updateProfile.mutate(
      { profile_public: next },
      {
        onSuccess: () => {
          addNotification(
            next
              ? t('settings.privacy.madePublic', 'Your profile is now public.')
              : t('settings.privacy.madePrivate', 'Your profile is now private.'),
            { variant: 'success' },
          );
        },
        onError: () => {
          addNotification(
            t('settings.privacy.error', 'Failed to update privacy setting.'),
            { variant: 'error' },
          );
        },
      },
    );
  };

  return (
    <div className="bg-[#1A251D] rounded-2xl border border-[#28382D] p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-[#E4B643]" aria-hidden="true" />
        <h2 className="text-lg font-bold text-white">
          {t('settings.privacy.heading', 'Privacy & Visibility')}
        </h2>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-white">
            {t('settings.privacy.publicProfile', 'Public profile')}
          </p>
          <p className="text-xs text-[#8C9C92] mt-0.5">
            {t(
              'settings.privacy.publicProfileDescription',
              'When enabled, other users can find and view your profile.',
            )}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={profile?.profile_public ?? true}
          disabled={isLoading || updateProfile.isPending}
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E4B643] disabled:opacity-50 disabled:cursor-not-allowed ${
            profile?.profile_public ? 'bg-[#E4B643]' : 'bg-[#28382D]'
          }`}
          aria-label={t('settings.privacy.toggleAria', 'Toggle public profile')}
        >
          <span
            aria-hidden="true"
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              profile?.profile_public ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
