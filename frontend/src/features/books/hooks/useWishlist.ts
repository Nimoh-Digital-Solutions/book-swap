/**
 * useWishlist.ts
 *
 * TanStack Query hook for fetching the user's wishlist items.
 */
import { useQuery } from '@tanstack/react-query';

import { wishlistService } from '../services/wishlist.service';
import type { PaginatedWishlist } from '../types/book.types';
import { wishlistKeys } from './bookKeys';

export function useWishlist(enabled = true) {
  return useQuery<PaginatedWishlist>({
    queryKey: wishlistKeys.list(),
    queryFn: () => wishlistService.list(),
    enabled,
  });
}
