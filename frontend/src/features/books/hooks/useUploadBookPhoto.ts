/**
 * useUploadBookPhoto.ts
 *
 * TanStack Query mutation hook for uploading a photo to a book listing.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { bookService } from '../services/book.service';
import type { BookPhoto } from '../types/book.types';
import { bookKeys } from './bookKeys';

export function useUploadBookPhoto(bookId: string) {
  const queryClient = useQueryClient();

  return useMutation<BookPhoto, Error, File>({
    mutationFn: (file) => bookService.uploadPhoto(bookId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookKeys.detail(bookId) });
    },
  });
}
