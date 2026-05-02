/**
 * CurrentLocationToggle — small button that lets authenticated users
 * browse from their live GPS position instead of their saved profile location.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { Loader2, LocateFixed, LocateOff } from 'lucide-react';

interface CurrentLocationToggleProps {
  active: boolean;
  detecting: boolean;
  error: string | null;
  onToggle: () => void;
}

export function CurrentLocationToggle({
  active,
  detecting,
  error,
  onToggle,
}: CurrentLocationToggleProps): ReactElement {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onToggle}
        disabled={detecting}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
          active
            ? 'bg-[#E4B643] text-[#152018]'
            : 'bg-surface-dark border border-white/10 text-gray-300 hover:text-white hover:bg-white/5'
        } disabled:opacity-50`}
        aria-pressed={active}
        aria-label={t(
          'discovery.currentLocation.toggle',
          active ? 'Using current location' : 'Use my current location',
        )}
      >
        {detecting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
        ) : active ? (
          <LocateFixed className="w-3.5 h-3.5" aria-hidden="true" />
        ) : (
          <LocateOff className="w-3.5 h-3.5" aria-hidden="true" />
        )}
        {t(
          active
            ? 'discovery.currentLocation.active'
            : 'discovery.currentLocation.label',
          active ? 'Current location' : 'Use my location',
        )}
      </button>
      {error && (
        <span className="text-xs text-amber-400" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
