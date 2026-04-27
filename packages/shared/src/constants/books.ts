import type { BookCondition, BookLanguage, BookStatus, SwapType } from '../types/book';

export const BOOK_CONDITIONS = ['new', 'like_new', 'good', 'acceptable'] as const satisfies readonly BookCondition[];

export const BOOK_STATUSES = ['available', 'in_exchange', 'returned'] as const satisfies readonly BookStatus[];

export const BOOK_LANGUAGES = ['en', 'nl', 'de', 'fr', 'es', 'other'] as const satisfies readonly BookLanguage[];

export const SWAP_TYPES = ['temporary', 'permanent'] as const satisfies readonly SwapType[];

export const BOOK_CONDITION_LABELS: Record<BookCondition, string> = {
  new: 'New',
  like_new: 'Like New',
  good: 'Good',
  acceptable: 'Acceptable',
};

export const BOOK_LANGUAGE_LABELS: Record<BookLanguage, string> = {
  en: 'English',
  nl: 'Dutch',
  de: 'German',
  fr: 'French',
  es: 'Spanish',
  other: 'Other',
};

export const SWAP_TYPE_LABELS: Record<SwapType, string> = {
  temporary: 'Temporary (with return)',
  permanent: 'Permanent (keep)',
};
