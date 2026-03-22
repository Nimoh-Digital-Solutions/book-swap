/**
 * useBook.ts
 *
 * TanStack Query hook for fetching a single book detail.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { bookService } from '../services/book.service';
import type { Book } from '../types/book.types';
import { bookKeys } from './bookKeys';

export function useBook(
  id: string,
  enabled = true,
): UseQueryResult<Book> {
  return useQuery({
    queryKey: bookKeys.detail(id),
    queryFn: () => bookService.getDetail(id),
    enabled: !!id && enabled,
  });
}
