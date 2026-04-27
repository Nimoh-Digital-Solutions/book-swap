import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { logoMark } from '@assets';
import { SEOHead } from '@components';
import { LocaleLink } from '@components/common/LocaleLink/LocaleLink';
import { useCompleteOnboarding, useSetLocation } from '@features/profile';
import { useLocaleNavigate } from '@hooks/useLocaleNavigate';
import { PATHS, routeMetadata } from '@routes/config/paths';
import { Info, MapPin, Star } from 'lucide-react';

/**
 * OnboardingPage — "Step 2 of 2"
 *
 * Location setup page shown after registration.
 * Part of the auth flow but rendered outside the AuthPage layout route
 * since it has its own branding content.
 */
export function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useLocaleNavigate();
  const [location, setLocation] = useState('');
  const [error, setError] = useState<string | null>(null);

  const setLocationMutation = useSetLocation();
  const completeOnboardingMutation = useCompleteOnboarding();

  const isPending = setLocationMutation.isPending || completeOnboardingMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await setLocationMutation.mutateAsync({ postcode: location });
      await completeOnboardingMutation.mutateAsync();
      void navigate(PATHS.HOME, { replace: true });
    } catch {
      setError(t('onboarding.error', 'Could not save your location. Please try again.'));
    }
  };

  return (
    <main className="min-h-[100dvh] bg-background-dark flex items-center justify-center p-4 font-sans">
      <SEOHead
        title={routeMetadata[PATHS.ONBOARDING].title}
        description={routeMetadata[PATHS.ONBOARDING].description}
        path={PATHS.ONBOARDING}
        noIndex
      />
      <div className="w-full max-w-6xl bg-surface-dark shadow-2xl rounded-2xl overflow-hidden flex flex-col md:flex-row min-h-[100dvh] md:min-h-[700px] border border-border-dark">
        {/* ── Branding panel ──────────────────────────────────── */}
        <div className="md:w-5/12 bg-background-dark text-white p-8 md:p-12 flex-col justify-between relative overflow-hidden border-r border-border-dark hidden md:flex">
          <div className="absolute inset-0 bg-gradient-to-b from-background-dark/80 via-transparent to-background-dark/90 z-0" aria-hidden="true" />

          <div className="relative z-10">
            <LocaleLink to={PATHS.HOME} className="inline-flex items-center gap-3 mb-8">
              <img src={logoMark} alt="" width={32} height={32} />
              <span className="text-xl font-bold tracking-tight text-white">BookSwap</span>
            </LocaleLink>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              Find Books <span className="text-[#E4B643] italic">Near You</span>
            </h1>
            <p className="text-text-secondary text-lg leading-relaxed">
              {t(
                'onboarding.branding.subtitle',
                'Set your location to discover books available for swap in your neighborhood and connect with local readers.',
              )}
            </p>
          </div>

          <div className="relative z-10 mt-12 md:mt-0">
            <div className="bg-surface-dark/80 backdrop-blur-sm p-6 rounded-xl border border-border-dark">
              <div className="flex text-[#E4B643] mb-3 gap-1" aria-label="5 stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" aria-hidden="true" />
                ))}
              </div>
              <p className="italic text-gray-200 mb-4">
                &ldquo;Setting my neighborhood helped me find three amazing books just a 5-minute walk from my apartment!&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E4B643] to-[#d9b93e] flex items-center justify-center text-[#152018] text-sm font-bold border-2 border-[#E4B643]">
                  D
                </div>
                <div>
                  <p className="font-bold text-sm text-white">David Chen</p>
                  <p className="text-xs text-text-secondary">Local Reader</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Form panel ──────────────────────────────────────── */}
        <div className="md:w-7/12 bg-surface-dark p-8 md:p-12 lg:p-16 flex flex-col justify-center relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-border-dark" aria-hidden="true">
            <div className="h-full bg-[#E4B643] w-full" />
          </div>

          {/* Condensed mobile brand block (RESP-016, Sprint B).
            * Mirrors AuthSplitPanel — surface the brand promise above the
            * form on `<md` so mobile users get the same conversion-relevant
            * hero copy that desktop users see in the left panel. The
            * testimonial is intentionally omitted to keep the form
            * within reach above the fold. */}
          <div className="md:hidden mb-8">
            <LocaleLink to={PATHS.HOME} className="inline-flex items-center gap-3 mb-5">
              <img src={logoMark} alt="" width={32} height={32} />
              <span className="text-xl font-bold tracking-tight text-white">BookSwap</span>
            </LocaleLink>
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-white text-balance mb-2">
              {t('onboarding.branding.title', 'Find Books Near You')}
            </h1>
            <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
              {t(
                'onboarding.branding.subtitle',
                'Set your location to discover books available for swap in your neighborhood and connect with local readers.',
              )}
            </p>
          </div>

          <div className="max-w-md mx-auto w-full relative z-10">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <span className="uppercase tracking-widest text-xs font-bold text-text-secondary">
                {t('onboarding.step', 'Step 2 of 2')}
              </span>
              <LocaleLink
                to={PATHS.HOME}
                className="text-sm font-medium text-text-secondary hover:text-[#E4B643] transition-colors"
              >
                {t('onboarding.skip', 'Skip for now')}
              </LocaleLink>
            </div>

            <h2 className="text-3xl font-bold text-white mb-2">
              {t('onboarding.title', 'Where are you located?')}
            </h2>
            <p className="text-text-secondary mb-8">
              {t('onboarding.subtitle', 'This helps us show you the closest available books.')}
            </p>

            <form className="space-y-6" onSubmit={(e) => { void handleSubmit(e); }}>
              <div>
                <label
                  className="block text-sm font-medium text-text-secondary mb-2"
                  htmlFor="location"
                >
                  {t('onboarding.locationLabel', 'City, Neighborhood, or Zip Code')}
                </label>
                <div className="relative">
                  <input
                    id="location"
                    type="text"
                    placeholder={t('onboarding.locationPlaceholder', 'e.g. Amsterdam West, 1054')}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-[#28382D] rounded-xl sm:text-sm bg-[#152018] text-white placeholder-[#5A6A60] transition-colors focus:ring-[#E4B643] focus:border-[#E4B643]"
                    aria-label={t('onboarding.locationLabel', 'City, Neighborhood, or Zip Code')}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="text-text-muted w-5 h-5" aria-hidden="true" />
                  </div>
                </div>
              </div>

              {/* Privacy info box */}
              <div className="bg-[#E4B643]/10 border border-[#E4B643]/20 rounded-xl p-4 flex gap-3">
                <Info className="text-[#E4B643] w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm text-text-secondary">
                  {t(
                    'onboarding.privacyNote',
                    'We only use your location to calculate distances to available books. Your exact address is never shared with other users.',
                  )}
                </p>
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-400">
                  {error}
                </p>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  disabled={isPending}
                  className="flex-1 flex justify-center py-3.5 px-4 border border-border-dark rounded-xl text-sm font-bold text-white bg-surface-dark hover:bg-border-dark transition-colors disabled:opacity-50"
                >
                  {t('common.back', 'Back')}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-[2] flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-[#152018] bg-[#E4B643] hover:bg-[#d9b93e] transition-colors disabled:opacity-60"
                >
                  {isPending
                    ? t('common.saving', 'Saving…')
                    : t('onboarding.submit', 'Complete Setup')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
