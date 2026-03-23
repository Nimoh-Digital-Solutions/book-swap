import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import type { Rating } from '../../types/rating.types';
import { StarDisplay } from '../StarDisplay/StarDisplay';

interface RatingCardProps {
  rating: Rating;
}

export function RatingCard({ rating }: RatingCardProps): ReactElement {
  const { t } = useTranslation('ratings');
  const date = new Date(rating.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="bg-[#1A251D] rounded-xl border border-[#28382D] p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{rating.rater.username}</span>
          <StarDisplay score={rating.score} />
        </div>
        <time className="text-xs text-[#8C9C92]" dateTime={rating.created_at}>{date}</time>
      </div>
      {rating.comment ? (
        <p className="text-sm text-[#8C9C92]">{rating.comment}</p>
      ) : (
        <p className="text-sm text-[#8C9C92] italic">{t('noComment', 'No comment')}</p>
      )}
    </div>
  );
}
