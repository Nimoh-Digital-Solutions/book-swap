import { type FormEvent, type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppStore } from '@data/useAppStore';
import { Loader2, MapPin, Navigation } from 'lucide-react';

import { useProfile } from '../../hooks/useProfile';
import { useSetLocation } from '../../hooks/useSetLocation';

export function LocationSection(): ReactElement {
  const { t } = useTranslation();
  const { data: profile } = useProfile();
  const setLocation = useSetLocation();
  const addNotification = useAppStore((s) => s.addNotification);

  const [postcode, setPostcode] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);

  const handleManualSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = postcode.trim();
    if (!trimmed || setLocation.isPending) return;

    setLocation.mutate(
      { postcode: trimmed },
      {
        onSuccess: (data) => {
          setPostcode('');
          addNotification(
            data.neighborhood
              ? t('settings.location.updated', 'Location set to {{neighborhood}}', {
                  neighborhood: data.neighborhood,
                })
              : t('settings.location.updatedGeneric', 'Your location has been updated.'),
            { variant: 'success' },
          );
        },
        onError: () => {
          addNotification(
            t(
              'settings.location.notFound',
              'Could not find that location. Please check and try again.',
            ),
            { variant: 'error' },
          );
        },
      },
    );
  };

  const handleGps = async () => {
    if (!navigator.geolocation) {
      addNotification(
        t('settings.location.noGps', 'Geolocation is not supported by your browser.'),
        { variant: 'error' },
      );
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation.mutate(
          { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
          {
            onSuccess: (data) => {
              addNotification(
                data.neighborhood
                  ? t('settings.location.updated', 'Location set to {{neighborhood}}', {
                      neighborhood: data.neighborhood,
                    })
                  : t('settings.location.updatedGeneric', 'Your location has been updated.'),
                { variant: 'success' },
              );
            },
            onError: () => {
              addNotification(
                t('settings.location.gpsError', 'Failed to update location via GPS.'),
                { variant: 'error' },
              );
            },
            onSettled: () => setGpsLoading(false),
          },
        );
      },
      () => {
        setGpsLoading(false);
        addNotification(
          t('settings.location.denied', 'Location access denied. Please check your browser settings.'),
          { variant: 'error' },
        );
      },
      { enableHighAccuracy: false, timeout: 15000 },
    );
  };

  const isBusy = setLocation.isPending || gpsLoading;

  return (
    <div className="bg-[#1A251D] rounded-2xl border border-[#28382D] p-6 space-y-5">
      <div className="flex items-center gap-2">
        <MapPin className="w-5 h-5 text-[#E4B643]" aria-hidden="true" />
        <h2 className="text-lg font-bold text-white">
          {t('settings.location.heading', 'Location')}
        </h2>
      </div>

      {/* Current location */}
      {profile?.neighborhood && (
        <div className="flex items-center gap-2 text-sm text-[#8C9C92]">
          <MapPin className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <span>
            {t('settings.location.current', 'Current: {{neighborhood}}', {
              neighborhood: profile.neighborhood,
            })}
          </span>
        </div>
      )}

      {/* Manual entry form */}
      <form onSubmit={handleManualSubmit} className="space-y-3">
        <label htmlFor="location-input" className="sr-only">
          {t('settings.location.inputLabel', 'City, neighborhood, or postcode')}
        </label>
        <input
          id="location-input"
          type="text"
          value={postcode}
          onChange={(e) => setPostcode(e.target.value)}
          placeholder={t('settings.location.placeholder', 'e.g. Amsterdam West, 1054')}
          disabled={isBusy}
          className="w-full px-4 py-2.5 rounded-xl text-base sm:text-sm bg-[#152018] border border-[#28382D] text-white placeholder-[#5A6E60] focus:outline-none focus:ring-2 focus:ring-[#E4B643] disabled:opacity-50"
        />
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isBusy || !postcode.trim()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-[#E4B643] text-[#152018] hover:bg-[#d4a633] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {setLocation.isPending && !gpsLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <MapPin className="w-4 h-4" aria-hidden="true" />
            )}
            {t('settings.location.setBtn', 'Set location')}
          </button>
          <button
            type="button"
            onClick={handleGps}
            disabled={isBusy}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-[#28382D] text-[#8C9C92] hover:bg-[#28382D]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {gpsLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Navigation className="w-4 h-4" aria-hidden="true" />
            )}
            {t('settings.location.useGps', 'Use GPS')}
          </button>
        </div>
      </form>

      <p className="text-xs text-[#5A6E60]">
        {t(
          'settings.location.privacyNote',
          'Your exact address is never shared — we only use it to calculate distances to available books.',
        )}
      </p>
    </div>
  );
}
