/**
 * FilterChips — active filter chips with remove buttons and clear-all.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { X } from 'lucide-react';

import type { BrowseFilters } from '../../types/discovery.types';

interface FilterChipsProps {
  filters: BrowseFilters;
  totalCount?: number | undefined;
  onRemoveGenre: (genre: string) => void;
  onRemoveLanguage: (lang: string) => void;
  onRemoveCondition: (cond: string) => void;
  onClearAll: () => void;
}

export function FilterChips({
  filters,
  totalCount,
  onRemoveGenre,
  onRemoveLanguage,
  onRemoveCondition,
  onClearAll,
}: FilterChipsProps): ReactElement | null {
  const { t } = useTranslation();

  const hasFilters =
    (filters.genre?.length ?? 0) > 0 ||
    (filters.language?.length ?? 0) > 0 ||
    (filters.condition?.length ?? 0) > 0;

  if (!hasFilters) {
    return totalCount != null ? (
      <p className="text-[#8C9C92] text-sm">
        {t('discovery.results.count', {
          count: totalCount,
          defaultValue: '{{count}} books found',
        })}
      </p>
    ) : null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {totalCount != null && (
        <span className="text-[#8C9C92] text-sm mr-2">
          {t('discovery.results.count', {
            count: totalCount,
            defaultValue: '{{count}} books found',
          })}
        </span>
      )}

      {filters.genre?.map(g => (
        <Chip key={`genre-${g}`} label={g} onRemove={() => onRemoveGenre(g)} />
      ))}
      {filters.language?.map(l => (
        <Chip key={`lang-${l}`} label={l} onRemove={() => onRemoveLanguage(l)} />
      ))}
      {filters.condition?.map(c => (
        <Chip
          key={`cond-${c}`}
          label={c.replace('_', ' ')}
          onRemove={() => onRemoveCondition(c)}
        />
      ))}

      <button
        type="button"
        onClick={onClearAll}
        className="text-[#E4B643] text-xs hover:underline"
      >
        {t('discovery.filters.clearAll', 'Clear all filters')}
      </button>
    </div>
  );
}

function Chip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}): ReactElement {
  return (
    <span className="inline-flex items-center gap-1 bg-[#28382D] text-white text-xs px-2.5 py-1 rounded-full">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="hover:text-[#E4B643]"
        aria-label={`Remove ${label}`}
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}
