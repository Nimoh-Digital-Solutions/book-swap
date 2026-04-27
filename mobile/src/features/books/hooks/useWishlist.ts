import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { showErrorToast } from '@/components/Toast';
import type { WishlistItem, CreateWishlistPayload, PaginatedResponse } from '@/types';
import {
  addWishlistItem as addWishlistItemApi,
  fetchWishlist as fetchWishlistApi,
  fetchWishlistStatusForBook,
  removeWishlistItem as removeWishlistItemApi,
} from '@/features/books/wishlistApi';

export const wishlistKeys = {
  all: ['wishlist'] as const,
  list: () => [...wishlistKeys.all, 'list'] as const,
  byBook: (bookId: string) => [...wishlistKeys.all, 'book', bookId] as const,
};

export function useWishlist() {
  return useQuery<PaginatedResponse<WishlistItem>>({
    queryKey: wishlistKeys.list(),
    queryFn: () => fetchWishlistApi(),
  });
}

export function useBookWishlistStatus(bookId: string) {
  return useQuery<WishlistItem | null>({
    queryKey: wishlistKeys.byBook(bookId),
    queryFn: () => fetchWishlistStatusForBook(bookId),
  });
}

export function useAddWishlistItem() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<WishlistItem, Error, CreateWishlistPayload>({
    mutationFn: (payload) => addWishlistItemApi(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.list() });
      if (variables.book) {
        queryClient.invalidateQueries({ queryKey: wishlistKeys.byBook(variables.book) });
      }
    },
    onError: () => showErrorToast(t('books.wishlist.addError', 'Failed to add to wishlist')),
  });
}

export function useRemoveWishlistItem() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<void, Error, { id: string; bookId?: string }>({
    mutationFn: ({ id }) => removeWishlistItemApi(id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.list() });
      if (variables.bookId) {
        queryClient.invalidateQueries({ queryKey: wishlistKeys.byBook(variables.bookId) });
      }
    },
    onError: () => showErrorToast(t('books.wishlist.removeError', 'Failed to remove from wishlist')),
  });
}
