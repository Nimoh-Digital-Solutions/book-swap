/**
 * BrowseEmptyState — shown when no books match the current browse query.
 *
 * Differentiates between two cases:
 *   1. Active filters produced no results → prompt to clear them.
 *   2. No filters, simply no books in this area → hint to expand radius.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { EmptyPlaceholder } from '@components/common';
import { BookOpen, SlidersHorizontal } from 'lucide-react';

interface BrowseEmptyStateProps {
  search?: string | undefined;
  radiusKm?: number | undefined;
  hasFilters?: boolean | undefined;
  onClearFilters?: (() => void) | undefined;
  /** @deprecated Not used — radius is adjusted via the filter panel. */
  onExpandRadius?: (() => void) | undefined;
}

export function BrowseEmptyState({
  search,
  radiusKm,
  hasFilters = false,
  onClearFilters,
}: BrowseEmptyStateProps): ReactElement {
  const { t } = useTranslation();

  if (hasFilters) {
    const title = search
      ? t('discovery.results.emptySearch', {
          query: search,
          defaultValue: "No books matching '{{query}}' found nearby",
        })
      : t('discovery.results.emptyFilters', 'No books match your current filters');

    return (
      <EmptyPlaceholder
        icon={SlidersHorizontal}
        title={title}
        description={t(
          'discovery.results.emptyFiltersHint',
          'Try removing some filters to see more results.',
        )}
        {...(onClearFilters
          ? {
              action: {
                label: t('discovery.filters.clearAll', 'Clear all filters'),
                onClick: onClearFilters,
              },
            }
          : {})}
      />
    );
  }

  const noFilterTitle = search
    ? t('discovery.results.emptySearch', {
        query: search,
        radius: radiusKm,
        defaultValue: "No results for '{{query}}' within {{radius}} km",
      })
    : t('discovery.results.empty', {
        radius: radiusKm,
        defaultValue: 'No books within {{radius}} km',
      });

  return (
    <EmptyPlaceholder
      icon={BookOpen}
      title={noFilterTitle}
      description={t(
        'discovery.results.emptyHint',
        'There are no available books in this area yet. Try adjusting your search radius or location in the filter panel.',
      )}
    />
  );
}
