/**
 * FilterPanel — genre / language / condition multi-select filters.
 *
 * Desktop: rendered inline as a sidebar.
 * Mobile: rendered inside MobileFilterSheet.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import type { BrowseFilters } from '../../types/discovery.types';
import { FilterGroup } from '../FilterGroup';

const GENRE_OPTIONS = [
  'Fiction',
  'Non-Fiction',
  'Sci-Fi',
  'Fantasy',
  'Mystery/Thriller',
  'Romance',
  'Biography',
  'History',
  'Science',
  'Philosophy',
  'Self-Help',
  'Business',
  'Poetry',
  'Graphic Novel',
  "Children's",
  'Young Adult',
  'Horror',
  'Travel',
  'Cooking',
  'Art',
  'Other',
] as const;

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'nl', label: 'Dutch' },
  { value: 'de', label: 'German' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
  { value: 'other', label: 'Other' },
] as const;

const CONDITION_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'acceptable', label: 'Acceptable' },
] as const;

interface FilterPanelProps {
  filters: BrowseFilters;
  onGenreChange: (genres: string[]) => void;
  onLanguageChange: (languages: string[]) => void;
  onConditionChange: (conditions: string[]) => void;
  onClearAll: () => void;
}

export function FilterPanel({
  filters,
  onGenreChange,
  onLanguageChange,
  onConditionChange,
  onClearAll,
}: FilterPanelProps): ReactElement {
  const { t } = useTranslation();

  const hasActiveFilters =
    (filters.genre?.length ?? 0) > 0 ||
    (filters.language?.length ?? 0) > 0 ||
    (filters.condition?.length ?? 0) > 0;

  const genreOptions = GENRE_OPTIONS.map(g => ({ value: g, label: g }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">
          {t('discovery.filters.title', 'Filters')}
        </h2>
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

      <FilterGroup
        label={t('discovery.filters.genre', 'Genre')}
        options={genreOptions}
        selected={filters.genre ?? []}
        onChange={onGenreChange}
      />

      <FilterGroup
        label={t('discovery.filters.language', 'Language')}
        options={LANGUAGE_OPTIONS as unknown as { value: string; label: string }[]}
        selected={filters.language ?? []}
        onChange={onLanguageChange}
      />

      <FilterGroup
        label={t('discovery.filters.condition', 'Condition')}
        options={CONDITION_OPTIONS as unknown as { value: string; label: string }[]}
        selected={filters.condition ?? []}
        onChange={onConditionChange}
      />
    </div>
  );
}
