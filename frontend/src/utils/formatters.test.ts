import { describe, expect,it } from 'vitest';

import { capitalize,formatDate, truncateString } from './formatters';

describe('formatters', () => {
  describe('formatDate', () => {
    const testDate = new Date('2024-03-15T12:00:00Z');

    it('formats date with default options (stable with UTC)', () => {
      const result = formatDate(
        testDate,
        { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' },
        'en-US'
      );
      expect(result).toBe('March 15, 2024');
    });

    it('formats date from string (stable with UTC)', () => {
      const result = formatDate(
        '2024-03-15T00:00:00Z',
        { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' },
        'en-US'
      );
      expect(result).toBe('March 15, 2024');
    });

    it('formats date from timestamp (stable with UTC)', () => {
      const result = formatDate(
        testDate.getTime(),
        { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' },
        'en-US'
      );
      expect(result).toBe('March 15, 2024');
    });

    it('formats with custom options', () => {
      const result = formatDate(
        testDate,
        { month: 'short', day: 'numeric', timeZone: 'UTC' },
        'en-US'
      );
      expect(result).toBe('Mar 15');
    });

    it('formats with different locale', () => {
      const result = formatDate(
        testDate,
        { month: 'long', day: 'numeric', timeZone: 'UTC' },
        'fr-FR'
      );
      // Avoid brittle exact match (some environments may include capitalization differences)
      expect(result.toLowerCase()).toContain('mars');
      expect(result).toContain('15');
    });

    it('returns empty string for invalid date input', () => {
      expect(formatDate('not-a-date')).toBe('');
      expect(formatDate(NaN)).toBe('');
    });
  });

  describe('truncateString', () => {
    it('truncates long strings', () => {
      expect(truncateString('This is a long string', 10)).toBe('This is...');
    });

    it('does not truncate short strings', () => {
      expect(truncateString('Short', 10)).toBe('Short');
    });

    it('uses custom suffix', () => {
      expect(truncateString('This is a long string', 10, '…')).toBe('This is a…');
    });

    it('handles exact length', () => {
      expect(truncateString('Exactly10!', 10)).toBe('Exactly10!');
    });

    it('handles empty string', () => {
      expect(truncateString('', 10)).toBe('');
    });

    it('accounts for suffix length', () => {
      const result = truncateString('12345678901234567890', 10, '...');
      expect(result.length).toBe(10);
      expect(result).toBe('1234567...');
    });

    it('handles maxLength smaller than suffix length', () => {
      expect(truncateString('Hello world', 2, '...')).toBe('..');
      expect(truncateString('Hello world', 1, '...')).toBe('.');
    });

    it('handles maxLength <= 0', () => {
      expect(truncateString('Hello', 0)).toBe('');
      expect(truncateString('Hello', -1)).toBe('');
    });
  });

  describe('capitalize', () => {
    it('capitalizes first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
    });

    it('handles already capitalized strings', () => {
      expect(capitalize('Hello')).toBe('Hello');
    });

    it('handles single character', () => {
      expect(capitalize('a')).toBe('A');
    });

    it('handles empty string', () => {
      expect(capitalize('')).toBe('');
    });

    it('only capitalizes first letter', () => {
      expect(capitalize('hello world')).toBe('Hello world');
    });

    it('preserves rest of string case', () => {
      expect(capitalize('hELLO')).toBe('HELLO');
    });
  });
});
