/**
 * useReorderPhotos.ts
 *
 * TanStack Query mutation hook for reordering photos on a book listing.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { bookService } from '../services/book.service';
import type { BookPhoto, ReorderPhotosPayload } from '../types/book.types';
import { bookKeys } from './bookKeys';

export function useReorderPhotos(bookId: string) {
  const queryClient = useQueryClient();

  return useMutation<BookPhoto[], Error, ReorderPhotosPayload>({
    mutationFn: (payload) => bookService.reorderPhotos(bookId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookKeys.detail(bookId) });
    },
  });
}
