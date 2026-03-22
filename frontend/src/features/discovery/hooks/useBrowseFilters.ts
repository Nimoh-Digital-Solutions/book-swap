/**
 * useBrowseFilters.ts
 *
 * Manages browse filter state synced to URL search params.
 * Uses React Router's useSearchParams for shareable/bookmarkable URLs.
 */
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import type { BrowseFilters, BrowseOrdering } from '../types/discovery.types';

const ORDERING_VALUES = new Set(['distance', '-created_at', 'relevance']);

function parseCommaSeparated(value: string | null): string[] | undefined {
  if (!value) return undefined;
  const items = value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  return items.length > 0 ? items : undefined;
}

export function useBrowseFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: BrowseFilters = useMemo(() => {
    const radius = searchParams.get('radius');
    const search = searchParams.get('search');
    const genre = searchParams.get('genre');
    const language = searchParams.get('language');
    const condition = searchParams.get('condition');
    const ordering = searchParams.get('ordering');

    return {
      radius: radius ? Number(radius) : undefined,
      search: search ?? undefined,
      genre: parseCommaSeparated(genre),
      language: parseCommaSeparated(language),
      condition: parseCommaSeparated(condition),
      ordering:
        ordering && ORDERING_VALUES.has(ordering)
          ? (ordering as BrowseOrdering)
          : undefined,
    };
  }, [searchParams]);

  const setFilters = useCallback(
    (update: Partial<BrowseFilters>) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev);

          // Helper: set or delete a param
          const set = (key: string, value: string | undefined) => {
            if (value) next.set(key, value);
            else next.delete(key);
          };

          if ('radius' in update)
            set('radius', update.radius ? String(update.radius) : undefined);
          if ('search' in update) set('search', update.search || undefined);
          if ('genre' in update)
            set('genre', update.genre?.join(',') || undefined);
          if ('language' in update)
            set('language', update.language?.join(',') || undefined);
          if ('condition' in update)
            set('condition', update.condition?.join(',') || undefined);
          if ('ordering' in update)
            set('ordering', update.ordering || undefined);

          // Reset page when filters change
          next.delete('page');

          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const clearFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  return { filters, setFilters, clearFilters };
}
