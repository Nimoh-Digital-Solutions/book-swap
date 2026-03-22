/**
 * useExternalBookSearch.ts
 *
 * TanStack Query hook for searching books via external APIs (e.g. Open Library).
 * Only fetches when enabled and a non-empty query is provided.
 */
import { useQuery } from '@tanstack/react-query';

import { isbnService } from '../services/isbn.service';
import type { BookMetadata } from '../types/book.types';
import { bookKeys } from './bookKeys';

export function useExternalBookSearch(query: string, enabled = true) {
  return useQuery<BookMetadata[]>({
    queryKey: bookKeys.externalSearch(query),
    queryFn: () => isbnService.searchExternal(query),
    enabled: enabled && query.trim().length >= 2,
  });
}
