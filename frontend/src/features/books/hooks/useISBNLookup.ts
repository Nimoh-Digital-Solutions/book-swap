/**
 * useISBNLookup.ts
 *
 * TanStack Query hook for looking up book metadata by ISBN.
 * Only fetches when enabled and a valid ISBN is provided.
 */
import { useQuery } from '@tanstack/react-query';

import { isbnService } from '../services/isbn.service';
import type { BookMetadata } from '../types/book.types';
import { bookKeys } from './bookKeys';

export function useISBNLookup(isbn: string, enabled = true) {
  return useQuery<BookMetadata>({
    queryKey: bookKeys.isbnLookup(isbn),
    queryFn: () => isbnService.lookupIsbn(isbn),
    enabled: enabled && isbn.length >= 10,
    retry: false,
  });
}
