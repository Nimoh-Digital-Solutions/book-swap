export const GENRE_OPTIONS = [
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

export type Genre = (typeof GENRE_OPTIONS)[number];

export const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'nl', label: 'Dutch' },
  { value: 'de', label: 'German' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
  { value: 'other', label: 'Other' },
] as const;

export type BookLanguage = (typeof LANGUAGE_OPTIONS)[number]['value'];

export const CONDITION_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'acceptable', label: 'Acceptable' },
] as const;

export type BookCondition = (typeof CONDITION_OPTIONS)[number]['value'];
