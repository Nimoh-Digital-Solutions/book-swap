/**
 * FilterPanel — reference-styled dark sidebar card.
 *
 * Desktop: rendered inside a sticky aside.
 * Mobile: rendered inside MobileFilterSheet.
 *
 * radius is passed in metres; the slider maps to km (1–50).
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { CONDITION_OPTIONS, GENRE_OPTIONS, LANGUAGE_OPTIONS } from '@constants/bookOptions';

import type { BrowseFilters } from '../../types/discovery.types';

const MAX_KM = 50;

interface FilterPanelProps {
  filters: BrowseFilters;
  /** Current search radius in metres. Defaults to 5000m (5km). */
  radius?: number;
  onRadiusChange?: (metres: number) => void;
  onGenreChange: (genres: string[]) => void;
  onLanguageChange: (languages: string[]) => void;
  onConditionChange: (conditions: string[]) => void;
  /** Called by the "APPLY FILTERS" button — useful for closing the mobile sheet. */
  onApplyFilters?: () => void;
  onClearAll: () => void;
}

export function FilterPanel({
  filters,
  radius = 5000,
  onRadiusChange,
  onGenreChange,
  onLanguageChange,
  onConditionChange,
  onApplyFilters,
  onClearAll,
}: FilterPanelProps): ReactElement {
  const { t } = useTranslation();

  const distanceKm = Math.max(1, Math.round(radius / 1000));
  const sliderPct = ((distanceKm - 1) / (MAX_KM - 1)) * 100;

  const toggleGenre = (genre: string) => {
    const current = filters.genre ?? [];
    const next = current.includes(genre)
      ? current.filter(g => g !== genre)
      : [...current, genre];
    onGenreChange(next);
  };

  const toggleCondition = (cond: string) => {
    const current = filters.condition ?? [];
    const next = current.includes(cond)
      ? current.filter(c => c !== cond)
      : [...current, cond];
    onConditionChange(next);
  };

  const selectedLanguage = filters.language?.[0] ?? '';

  const hasActiveFilters =
    (filters.genre?.length ?? 0) > 0 ||
    (filters.language?.length ?? 0) > 0 ||
    (filters.condition?.length ?? 0) > 0;

  return (
    <div className="bg-surface-dark border border-white/10 text-white rounded-2xl p-6 relative overflow-hidden">
      {/* Dot-pattern overlay */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10">
        {/* Header row */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#E4B643]" aria-hidden="true">
              tune
            </span>
            <h2 className="font-bold tracking-widest text-sm uppercase">
              {t('discovery.filters.title', 'Filters')}
            </h2>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-[#E4B643] text-xs hover:underline"
            >
              {t('discovery.filters.clearAll', 'Clear all')}
            </button>
          )}
        </div>

        {/* ── Distance ── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-gray-400 text-sm" aria-hidden="true">
                location_on
              </span>
              <h3 className="font-bold text-xs tracking-widest uppercase text-gray-300">
                {t('discovery.filters.distance', 'Distance')}
              </h3>
            </div>
            <span className="text-xs font-bold text-[#E4B643]">{distanceKm}km</span>
          </div>

          <div className="px-2">
            <div className="relative h-4 flex items-center mb-2">
              <input
                type="range"
                min="1"
                max={MAX_KM}
                value={distanceKm}
                onChange={e => onRadiusChange?.(Number(e.target.value) * 1000)}
                className="absolute w-full h-full opacity-0 cursor-pointer z-20"
                aria-label={t('discovery.filters.distance', 'Distance in km')}
              />
              <div className="h-1 w-full bg-white/10 rounded-full relative pointer-events-none z-10">
                <div
                  className="absolute left-0 top-0 h-full bg-[#E4B643] rounded-full"
                  style={{ width: `${sliderPct}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow border-2 border-[#E4B643]"
                  style={{ left: `calc(${sliderPct}% - 8px)` }}
                />
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 font-medium">
              <span>1km</span>
              <span>25km</span>
              <span>50km</span>
            </div>
          </div>
        </div>

        {/* ── Genre ── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-gray-400 text-sm" aria-hidden="true">
              category
            </span>
            <h3 className="font-bold text-xs tracking-widest uppercase text-gray-300">
              {t('discovery.filters.genre', 'Genre')}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {GENRE_OPTIONS.map(genre => {
              const active = (filters.genre ?? []).includes(genre);
              return (
                <button
                  key={genre}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleGenre(genre)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                    active
                      ? 'bg-[#E4B643] border-[#E4B643] text-[#152018] font-bold'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {genre}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Language ── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-gray-400 text-sm" aria-hidden="true">
              language
            </span>
            <h3 className="font-bold text-xs tracking-widest uppercase text-gray-300">
              {t('discovery.filters.language', 'Language')}
            </h3>
          </div>
          <div className="relative">
            <select
              value={selectedLanguage}
              onChange={e =>
                onLanguageChange(e.target.value ? [e.target.value] : [])
              }
              className="w-full appearance-none bg-background-dark border border-white/10 rounded-lg py-2.5 pl-4 pr-10 text-sm font-medium text-white focus:ring-1 focus:ring-[#E4B643] focus:border-[#E4B643] cursor-pointer outline-none transition-colors"
              aria-label={t('discovery.filters.language', 'Language')}
            >
              <option value="">
                {t('discovery.filters.allLanguages', 'All languages')}
              </option>
              {LANGUAGE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span
              className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              aria-hidden="true"
            >
              expand_more
            </span>
          </div>
        </div>

        {/* ── Condition ── */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-gray-400 text-sm" aria-hidden="true">
              auto_awesome
            </span>
            <h3 className="font-bold text-xs tracking-widest uppercase text-gray-300">
              {t('discovery.filters.condition', 'Condition')}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {CONDITION_OPTIONS.map(({ value, label }) => {
              const active = (filters.condition ?? []).includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleCondition(value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                    active
                      ? 'bg-[#E4B643] border-[#E4B643] text-[#152018] font-bold'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={onApplyFilters}
          className="w-full bg-[#E4B643] hover:bg-[#d9b93e] text-[#152018] font-bold py-3 rounded-full transition-colors text-sm tracking-wide"
        >
          APPLY FILTERS
        </button>
      </div>
    </div>
  );
}
