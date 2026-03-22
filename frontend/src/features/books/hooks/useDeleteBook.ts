/**
 * useDeleteBook.ts
 *
 * TanStack Query mutation hook for deleting a book listing.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { bookService } from '../services/book.service';
import { bookKeys } from './bookKeys';

export function useDeleteBook() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (bookId) => bookService.remove(bookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bookKeys.myShelf() });
    },
  });
}
