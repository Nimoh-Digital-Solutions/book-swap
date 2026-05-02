/**
 * LocationMismatchBanner — non-intrusive, session-dismissable banner shown
 * when the user's GPS location is significantly different from their stored
 * profile location (e.g. profile says Amsterdam but they're in Leeuwarden).
 *
 * Provides two actions:
 *  - **Update location** — navigates to the profile settings page.
 *  - **Dismiss** — hides the banner for the remainder of the session.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { MapPin, X } from 'lucide-react';

interface LocationMismatchBannerProps {
  detectedCity: string;
  profileNeighborhood: string;
  distanceKm: number;
  onDismiss: () => void;
}

export function LocationMismatchBanner({
  detectedCity,
  profileNeighborhood,
  distanceKm,
  onDismiss,
}: LocationMismatchBannerProps): ReactElement {
  const { t } = useTranslation();

  return (
    <div
      role="status"
      className="flex items-start gap-3 p-4 mb-6 rounded-xl border border-[#E4B643]/30 bg-[#E4B643]/10"
    >
      <MapPin className="w-5 h-5 text-[#E4B643] mt-0.5 shrink-0" aria-hidden="true" />

      <div className="flex-1 min-w-0">
        <p className="text-sm text-white">
          {t(
            'discovery.locationMismatch.message',
            'You seem to be in {{detectedCity}} (~{{distanceKm}} km away) but your profile says {{profileNeighborhood}}. Books you add won\'t be visible to nearby users.',
            { detectedCity, distanceKm, profileNeighborhood },
          )}
        </p>
        <div className="flex items-center gap-3 mt-2">
          <Link
            to="/profile/edit"
            className="text-sm font-medium text-[#E4B643] hover:underline"
          >
            {t('discovery.locationMismatch.update', 'Update my location')}
          </Link>
          <button
            type="button"
            onClick={onDismiss}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            {t('discovery.locationMismatch.dismiss', 'Dismiss')}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 p-1 text-gray-400 hover:text-white transition-colors rounded"
        aria-label={t('common.dismiss', 'Dismiss')}
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}
