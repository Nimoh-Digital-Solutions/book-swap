/**
 * useRemoveWishlistItem.ts
 *
 * TanStack Query mutation hook for removing an item from the wishlist.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { wishlistService } from '../services/wishlist.service';
import { wishlistKeys } from './bookKeys';

export function useRemoveWishlistItem() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => wishlistService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: wishlistKeys.list() });
    },
  });
}
