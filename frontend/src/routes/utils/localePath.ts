import i18n from '../../i18n';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../../i18n';

/**
 * Build an absolute URL path prefixed with the current (or given) language.
 *
 * @param path  - An absolute path starting with `/` (e.g. `/login`, `/books/42`).
 *                Hash-only paths like `#how-it-works` are prefixed with `/{lng}/`.
 * @param lng   - Override language. Defaults to the active i18next language.
 * @returns       Locale-prefixed path, e.g. `/en/login`.
 *
 * @example
 * localePath('/login');           // → '/en/login'  (if current lang is 'en')
 * localePath('/login', 'fr');     // → '/fr/login'
 * localePath('/');                // → '/en'
 * localePath('#how-it-works');   // → '/en#how-it-works'
 */
export function localePath(path: string, lng?: string): string {
  const lang = lng ?? i18n.language ?? 'en';

  if (path === '/') return `/${lang}`;
  if (path.startsWith('#')) return `/${lang}${path}`;

  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `/${lang}${normalized}`;
}

/**
 * Strip the `/:lng` prefix from a path, returning the bare application path.
 *
 * Useful for chunk-map lookups where keys are language-agnostic.
 *
 * @example
 * stripLocalePath('/en/login');  // → '/login'
 * stripLocalePath('/fr');        // → '/'
 * stripLocalePath('/login');     // → '/login'  (no lang prefix → unchanged)
 */
export function stripLocalePath(path: string): string {
  const match = path.match(
    new RegExp(`^/(${SUPPORTED_LANGUAGES.join('|')})(/.*)?$`),
  );
  if (!match) return path;
  return match[2] || '/';
}

/**
 * Check whether a string is a supported language code.
 */
export function isSupportedLanguage(
  code: string | undefined,
): code is SupportedLanguage {
  return !!code && (SUPPORTED_LANGUAGES as readonly string[]).includes(code);
}
