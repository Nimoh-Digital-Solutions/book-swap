import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import type { BookCondition } from '../../types/book.types';

const CONDITION_STYLES: Record<BookCondition, string> = {
  new: 'bg-green-900/40 text-green-400 border-green-800',
  like_new: 'bg-emerald-900/40 text-emerald-400 border-emerald-800',
  good: 'bg-amber-900/40 text-amber-400 border-amber-800',
  acceptable: 'bg-orange-900/40 text-orange-400 border-orange-800',
};

interface ConditionBadgeProps {
  condition: BookCondition;
  className?: string;
}

export function ConditionBadge({ condition, className = '' }: ConditionBadgeProps): ReactElement {
  const { t } = useTranslation();
  const label = t(`books.addBook.conditions.${condition}`, condition);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${CONDITION_STYLES[condition]} ${className}`}
    >
      {label}
    </span>
  );
}
