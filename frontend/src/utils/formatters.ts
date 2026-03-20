/**
 * Format a date to a readable string.
 * Notes:
 * - Use `timeZone: 'UTC'` in options for stable output across environments/tests.
 * - Returns empty string for invalid dates.
 * - `locale` defaults to the browser/OS locale (`navigator.language`) so
 *   formatted dates feel native to the user. Pass an explicit locale string
 *   (e.g. `'en-US'`) when stable, locale-independent output is required.
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
  locale: string = (typeof navigator !== 'undefined' && navigator.language) || 'en-US'
): string {
  const dateObj = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(dateObj.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(locale, options).format(dateObj);
}

/**
 * Truncate a string to a specified length.
 * If `maxLength` is shorter than the suffix, it returns a sliced suffix.
 */
export function truncateString(str: string, maxLength: number, suffix = '...'): string {
  if (maxLength <= 0) return '';
  if (str.length <= maxLength) return str;

  if (suffix.length >= maxLength) {
    return suffix.slice(0, maxLength);
  }

  return str.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Capitalise the first character of a string.
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
