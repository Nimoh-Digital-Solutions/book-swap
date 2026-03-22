/**
 * BrowseEmptyState — shown when no books match the current filters.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { BookOpen } from 'lucide-react';

interface BrowseEmptyStateProps {
  search?: string | undefined;
  radiusKm?: number | undefined;
  onExpandRadius?: (() => void) | undefined;
}

export function BrowseEmptyState({
  search,
  radiusKm,
  onExpandRadius,
}: BrowseEmptyStateProps): ReactElement {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <BookOpen className="w-16 h-16 text-[#28382D] mb-4" aria-hidden="true" />
      <p className="text-white text-lg font-medium mb-2">
        {search
          ? t('discovery.results.emptySearch', {
              query: search,
              defaultValue: "No books matching '{{query}}' found nearby",
            })
          : t('discovery.results.empty', {
              radius: radiusKm,
              defaultValue: 'No books found within {{radius}} km',
            })}
      </p>
      {onExpandRadius && (
        <button
          type="button"
          onClick={onExpandRadius}
          className="text-[#E4B643] text-sm hover:underline mt-2"
        >
          {t('discovery.results.expandRadius', 'Try expanding your search radius')}
        </button>
      )}
    </div>
  );
}
