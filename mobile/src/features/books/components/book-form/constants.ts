import type { CreateBookPayload } from "@/features/books/hooks/useBooks";

export const MAX_GENRES = 3;

export const CONDITIONS: {
  key: NonNullable<CreateBookPayload["condition"]>;
  label: string;
}[] = [
  { key: "new", label: "New" },
  { key: "like_new", label: "Like New" },
  { key: "good", label: "Good" },
  { key: "acceptable", label: "Acceptable" },
];

export const LANGUAGES: {
  key: NonNullable<CreateBookPayload["language"]>;
  label: string;
}[] = [
  { key: "en", label: "English" },
  { key: "nl", label: "Dutch" },
  { key: "de", label: "German" },
  { key: "fr", label: "French" },
  { key: "es", label: "Spanish" },
  { key: "other", label: "Other" },
];

export const SWAP_TYPES: {
  key: NonNullable<CreateBookPayload["swap_type"]>;
  label: string;
}[] = [
  { key: "temporary", label: "Temporary (with return)" },
  { key: "permanent", label: "Permanent (keep)" },
];

const LANG_CODE_MAP: Record<string, NonNullable<CreateBookPayload["language"]>> =
  {
    en: "en",
    eng: "en",
    english: "en",
    nl: "nl",
    dut: "nl",
    nld: "nl",
    dutch: "nl",
    de: "de",
    ger: "de",
    deu: "de",
    german: "de",
    fr: "fr",
    fre: "fr",
    fra: "fr",
    french: "fr",
    es: "es",
    spa: "es",
    spanish: "es",
  };

export function resolveLanguage(
  raw?: string,
): NonNullable<CreateBookPayload["language"]> | null {
  if (!raw) return null;
  const key = raw.toLowerCase().trim();
  return LANG_CODE_MAP[key] ?? "other";
}
