/**
 * useDeleteBookPhoto.ts
 *
 * TanStack Query mutation hook for deleting a photo from a book listing.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { bookService } from '../services/book.service';
import { bookKeys } from './bookKeys';

export function useDeleteBookPhoto(bookId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (photoId) => bookService.deletePhoto(bookId, photoId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bookKeys.detail(bookId) });
    },
  });
}
