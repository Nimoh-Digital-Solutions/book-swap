import { type ReactElement,useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppStore } from '@data/useAppStore';

import { useExchangeRatingStatus } from '../../hooks/useExchangeRatingStatus';
import { useSubmitRating } from '../../hooks/useSubmitRating';
import { StarDisplay } from '../StarDisplay/StarDisplay';
import { StarRating } from '../StarRating/StarRating';

interface RatingPromptProps {
  exchangeId: string;
}

export function RatingPrompt({ exchangeId }: RatingPromptProps): ReactElement | null {
  const { t } = useTranslation('ratings');
  const addNotification = useAppStore(s => s.addNotification);
  const { data: status, isLoading } = useExchangeRatingStatus(exchangeId);
  const submitMutation = useSubmitRating(exchangeId);

  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = useCallback(() => {
    if (score === 0) return;
    submitMutation.mutate(
      { score, comment: comment.trim() || undefined },
      {
        onSuccess: () => {
          addNotification(t('submit.success', 'Rating submitted!'), { variant: 'success' });
        },
        onError: () => {
          addNotification(t('submit.error', 'Failed to submit rating.'), { variant: 'error' });
        },
      },
    );
  }, [score, comment, submitMutation, addNotification, t]);

  if (isLoading || !status) return null;

  // Already rated — show existing rating
  if (status.my_rating) {
    return (
      <div className="bg-[#1A251D] rounded-xl border border-[#28382D] p-6">
        <h3 className="text-sm font-medium text-[#8C9C92] uppercase tracking-wider mb-3">
          {t('myRating', 'My Rating')}
        </h3>
        <div className="flex items-center gap-2 mb-2">
          <StarDisplay score={status.my_rating.score} size="md" />
          <span className="text-sm text-white font-medium">{status.my_rating.score}/5</span>
        </div>
        {status.my_rating.comment && (
          <p className="text-sm text-[#8C9C92]">{status.my_rating.comment}</p>
        )}

        {status.partner_rating && (
          <div className="mt-4 pt-4 border-t border-[#28382D]">
            <p className="text-xs text-[#8C9C92] mb-1">
              {t('partnerRating', 'Partner\'s Rating')}
            </p>
            <div className="flex items-center gap-2">
              <StarDisplay score={status.partner_rating.score} size="sm" />
              <span className="text-xs text-white">{status.partner_rating.score}/5</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Can't rate — window expired or other reason
  if (!status.can_rate) {
    return null;
  }

  // Rating form
  return (
    <div className="bg-[#1A251D] rounded-xl border border-[#28382D] p-6">
      <h3 className="text-sm font-medium text-[#8C9C92] uppercase tracking-wider mb-3">
        {t('rateExchange', 'Rate This Exchange')}
      </h3>
      <p className="text-xs text-[#8C9C92] mb-4">
        {t('ratePrompt', 'How was your experience with this swap?')}
      </p>

      <div className="mb-4">
        <StarRating
          value={score}
          onChange={setScore}
          disabled={submitMutation.isPending}
        />
      </div>

      <textarea
        className="w-full bg-[#152018] border border-[#28382D] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8C9C92] resize-none focus:border-[#E4B643] focus:outline-none"
        rows={3}
        maxLength={300}
        placeholder={t('commentPlaceholder', 'Leave an optional comment (max 300 characters)…')}
        value={comment}
        onChange={e => setComment(e.target.value)}
        disabled={submitMutation.isPending}
      />
      <p className="text-xs text-[#8C9C92] mt-1 text-right">{comment.length}/300</p>

      <button
        type="button"
        disabled={score === 0 || submitMutation.isPending}
        onClick={handleSubmit}
        className="mt-3 px-5 py-2.5 bg-[#E4B643] hover:bg-[#d9b93e] text-[#152018] font-bold text-sm rounded-full transition-colors disabled:opacity-50"
      >
        {submitMutation.isPending ? t('submit.loading', 'Submitting…') : t('submit.button', 'Submit Rating')}
      </button>
    </div>
  );
}
