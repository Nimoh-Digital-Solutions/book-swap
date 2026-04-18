/** Canonical genre strings stored in API / filters (unchanged). */
export const GENRE_VALUES = [
  "Fiction",
  "Non-Fiction",
  "Sci-Fi",
  "Fantasy",
  "Mystery/Thriller",
  "Romance",
  "Biography",
  "History",
  "Science",
  "Philosophy",
  "Self-Help",
  "Business",
  "Poetry",
  "Graphic Novel",
  "Children's",
  "Young Adult",
  "Horror",
  "Travel",
  "Cooking",
  "Art",
  "Other",
] as const;

export type GenreValue = (typeof GENRE_VALUES)[number];

/** Maps each canonical value to `books.genres.<key>` i18n suffix. */
export const GENRE_VALUE_TO_I18N_KEY: Record<GenreValue, string> = {
  Fiction: "fiction",
  "Non-Fiction": "non_fiction",
  "Sci-Fi": "sci_fi",
  Fantasy: "fantasy",
  "Mystery/Thriller": "mystery_thriller",
  Romance: "romance",
  Biography: "biography",
  History: "history",
  Science: "science",
  Philosophy: "philosophy",
  "Self-Help": "self_help",
  Business: "business",
  Poetry: "poetry",
  "Graphic Novel": "graphic_novel",
  "Children's": "childrens",
  "Young Adult": "young_adult",
  Horror: "horror",
  Travel: "travel",
  Cooking: "cooking",
  Art: "art",
  Other: "other",
};

/** @deprecated Use GENRE_VALUES — alias for migration */
export const GENRE_OPTIONS = GENRE_VALUES;

export const DISTANCE_OPTIONS = [
  { value: 1000, km: 1 },
  { value: 3000, km: 3 },
  { value: 5000, km: 5 },
  { value: 10000, km: 10 },
  { value: 25000, km: 25 },
  { value: 50000, km: 50 },
] as const;
