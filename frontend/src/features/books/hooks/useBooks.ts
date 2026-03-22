/**
 * useBooks.ts
 *
 * TanStack Query hook for listing books with optional filters.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { bookService } from '../services/book.service';
import type { BookListFilters, PaginatedBooks } from '../types/book.types';
import { bookKeys } from './bookKeys';

export function useBooks(
  filters?: BookListFilters,
  enabled = true,
): UseQueryResult<PaginatedBooks> {
  return useQuery({
    queryKey: bookKeys.list(filters),
    queryFn: () => bookService.list(filters),
    enabled,
  });
}
