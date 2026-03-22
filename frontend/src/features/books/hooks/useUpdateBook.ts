/**
 * useUpdateBook.ts
 *
 * TanStack Query mutation hook for updating a book listing.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { bookService } from '../services/book.service';
import type { Book, UpdateBookPayload } from '../types/book.types';
import { bookKeys } from './bookKeys';

export function useUpdateBook(bookId: string) {
  const queryClient = useQueryClient();

  return useMutation<Book, Error, UpdateBookPayload>({
    mutationFn: (payload) => bookService.update(bookId, payload),
    onSuccess: (updatedBook) => {
      queryClient.setQueryData(bookKeys.detail(bookId), updatedBook);
      queryClient.invalidateQueries({ queryKey: bookKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bookKeys.myShelf() });
    },
  });
}
