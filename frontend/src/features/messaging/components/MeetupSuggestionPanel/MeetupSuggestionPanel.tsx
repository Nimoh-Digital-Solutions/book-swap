import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { BookOpen, Coffee, Landmark, MapPin, TreePine, X } from 'lucide-react';

import type { MeetupCategory, MeetupLocation } from '../../types/messaging.types';

interface MeetupSuggestionPanelProps {
  locations: MeetupLocation[];
  isLoading: boolean;
  onSelect: (location: MeetupLocation) => void;
  onClose: () => void;
}

const CATEGORY_ICONS: Record<MeetupCategory, typeof MapPin> = {
  library: BookOpen,
  cafe: Coffee,
  park: TreePine,
  station: Landmark,
};

export function MeetupSuggestionPanel({
  locations,
  isLoading,
  onSelect,
  onClose,
}: MeetupSuggestionPanelProps): ReactElement {
  const { t } = useTranslation('messaging');

  return (
    <div className="border-t border-[#28382D] bg-[#152018]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#28382D]">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#E4B643]" aria-hidden="true" />
          {t('meetup.title')}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] p-1 rounded-full hover:bg-[#28382D] text-[#8C9C92] transition-colors"
          aria-label={t('meetup.close')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="max-h-[300px] overflow-y-auto p-3">
        {isLoading && (
          <div className="text-center py-8 text-sm text-[#8C9C92] animate-pulse">
            {t('chat.connecting')}
          </div>
        )}

        {!isLoading && locations.length === 0 && (
          <p className="text-center py-8 text-sm text-[#8C9C92]">
            {t('meetup.noSuggestions')}
          </p>
        )}

        {!isLoading && locations.length > 0 && (
          <div className="space-y-2">
            {locations.map((loc) => {
              const IconComponent = CATEGORY_ICONS[loc.category] ?? MapPin;
              return (
                <div
                  key={loc.id}
                  className="flex items-center gap-3 rounded-xl bg-[#1A251D] border border-[#28382D] p-3 hover:border-[#E4B643]/30 transition-colors"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#28382D] flex items-center justify-center">
                    <IconComponent className="w-5 h-5 text-[#E4B643]" aria-hidden="true" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{loc.name}</p>
                    <p className="text-xs text-[#8C9C92] truncate">{loc.address}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-[#8C9C92] capitalize">
                        {t(`meetup.category.${loc.category}`)}
                      </span>
                      {loc.distance_km != null && (
                        <span className="text-[10px] text-[#E4B643]">
                          {t('meetup.distance', { distance: loc.distance_km.toFixed(1) })}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelect(loc)}
                    className="flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-full bg-[#E4B643] text-[#152018] hover:bg-[#d9b93e] transition-colors"
                  >
                    {t('meetup.select')}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
