/**
 * useCreateBook.ts
 *
 * TanStack Query mutation hook for creating a new book listing.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { bookService } from '../services/book.service';
import type { Book, CreateBookPayload } from '../types/book.types';
import { bookKeys } from './bookKeys';

export function useCreateBook() {
  const queryClient = useQueryClient();

  return useMutation<Book, Error, CreateBookPayload>({
    mutationFn: (payload) => bookService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bookKeys.myShelf() });
    },
  });
}
