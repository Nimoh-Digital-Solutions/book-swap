import { type ReactElement,useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useUserRatings } from '../../hooks/useUserRatings';
import { RatingCard } from '../RatingCard/RatingCard';

interface RatingsListProps {
  userId: string;
}

export function RatingsList({ userId }: RatingsListProps): ReactElement {
  const { t } = useTranslation('ratings');
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useUserRatings(userId);

  // Flatten infinite-query pages into a single render list. Memoised so the
  // map below doesn't traverse every page on every parent re-render.
  const ratings = useMemo(
    () => data?.pages.flatMap((page) => page.results) ?? [],
    [data],
  );
  const totalCount = data?.pages[0]?.count ?? 0;

  if (isLoading) {
    return (
      <div className="animate-pulse text-[#8C9C92] text-sm">
        {t('loading', 'Loading ratings…')}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-red-400">{t('error.load', 'Failed to load ratings.')}</p>
    );
  }

  if (ratings.length === 0) {
    return (
      <p className="text-sm text-[#8C9C92]">{t('noRatings', 'No ratings yet.')}</p>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-[#8C9C92] uppercase tracking-wider">
        {t('ratingsTitle', 'Ratings')} ({totalCount})
      </h3>
      {ratings.map((rating) => (
        <RatingCard key={rating.id} rating={rating} />
      ))}
      {hasNextPage && (
        <button
          type="button"
          onClick={() => void fetchNextPage()}
          disabled={isFetchingNextPage}
          className="mt-2 w-full rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
        >
          {isFetchingNextPage
            ? t('loadingMore', 'Loading…')
            : t('loadMore', 'Load more')}
        </button>
      )}
    </div>
  );
}
