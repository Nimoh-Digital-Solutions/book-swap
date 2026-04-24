import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { SEOHead } from '@components';
import { useLocaleNavigate } from '@hooks/useLocaleNavigate';
import { PATHS, routeMetadata } from '@routes/config/paths';
import { ArrowLeft } from 'lucide-react';

import { EditProfileForm } from '../components/EditProfileForm';
import { useProfile } from '../hooks/useProfile';

export function EditProfilePage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useLocaleNavigate();
  const { data: profile, isLoading, isError } = useProfile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-[#8C9C92]">
          {t('common.loading', 'Loading…')}
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400">
          {t('profile.error', 'Unable to load profile.')}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <SEOHead
        title={routeMetadata[PATHS.PROFILE_EDIT].title}
        description={routeMetadata[PATHS.PROFILE_EDIT].description}
        path={PATHS.PROFILE_EDIT}
        noIndex
      />
      {/* Back link */}
      <button
        type="button"
        onClick={() => navigate(PATHS.PROFILE)}
        className="inline-flex items-center gap-1 text-sm text-[#8C9C92] hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        {t('profile.edit.backToProfile', 'Back to Profile')}
      </button>

      <div className="bg-[#1A251D] rounded-2xl border border-[#28382D] p-8">
        <h1 className="text-2xl font-bold text-white mb-6">
          {t('profile.edit.heading', 'Edit Profile')}
        </h1>
        <EditProfileForm
          profile={profile}
          onSuccess={() => navigate(PATHS.PROFILE)}
        />
      </div>
    </div>
  );
}
