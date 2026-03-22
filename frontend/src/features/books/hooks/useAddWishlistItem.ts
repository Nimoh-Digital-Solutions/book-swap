/**
 * useAddWishlistItem.ts
 *
 * TanStack Query mutation hook for adding an item to the wishlist.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { wishlistService } from '../services/wishlist.service';
import type { CreateWishlistPayload, WishlistItem } from '../types/book.types';
import { wishlistKeys } from './bookKeys';

export function useAddWishlistItem() {
  const queryClient = useQueryClient();

  return useMutation<WishlistItem, Error, CreateWishlistPayload>({
    mutationFn: (payload) => wishlistService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.list() });
    },
  });
}
