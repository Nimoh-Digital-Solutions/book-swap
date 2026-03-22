/**
 * useMyShelf.ts
 *
 * TanStack Query hook for the authenticated user's book shelf.
 * Fetches `GET /api/v1/books/?owner=me`.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { bookService } from '../services/book.service';
import type { PaginatedBooks } from '../types/book.types';
import { bookKeys } from './bookKeys';

export function useMyShelf(enabled = true): UseQueryResult<PaginatedBooks> {
  return useQuery({
    queryKey: bookKeys.myShelf(),
    queryFn: () => bookService.list({ owner: 'me' }),
    enabled,
  });
}
