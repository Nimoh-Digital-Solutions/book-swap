import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useUserRatings } from '../../hooks/useUserRatings';
import { RatingCard } from '../RatingCard/RatingCard';

interface RatingsListProps {
  userId: string;
}

export function RatingsList({ userId }: RatingsListProps): ReactElement {
  const { t } = useTranslation('ratings');
  const { data, isLoading, isError } = useUserRatings(userId);

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

  if (!data || data.results.length === 0) {
    return (
      <p className="text-sm text-[#8C9C92]">{t('noRatings', 'No ratings yet.')}</p>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-[#8C9C92] uppercase tracking-wider">
        {t('ratingsTitle', 'Ratings')} ({data.count})
      </h3>
      {data.results.map(rating => (
        <RatingCard key={rating.id} rating={rating} />
      ))}
    </div>
  );
}
