import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '@/services/http';
import { API } from '@/configs/apiEndpoints';
import { showErrorToast } from '@/components/Toast';
import type { WishlistItem, CreateWishlistPayload, PaginatedResponse } from '@/types';

export const wishlistKeys = {
  all: ['wishlist'] as const,
  list: () => [...wishlistKeys.all, 'list'] as const,
  byBook: (bookId: string) => [...wishlistKeys.all, 'book', bookId] as const,
};

export function useWishlist() {
  return useQuery<PaginatedResponse<WishlistItem>>({
    queryKey: wishlistKeys.list(),
    queryFn: async () => {
      const { data } = await http.get<PaginatedResponse<WishlistItem>>(
        API.wishlist.list,
      );
      return data;
    },
  });
}

export function useBookWishlistStatus(bookId: string) {
  return useQuery<WishlistItem | null>({
    queryKey: wishlistKeys.byBook(bookId),
    queryFn: async () => {
      const { data } = await http.get<PaginatedResponse<WishlistItem>>(
        API.wishlist.byBook(bookId),
      );
      return data.results?.[0] ?? null;
    },
  });
}

export function useAddWishlistItem() {
  const queryClient = useQueryClient();

  return useMutation<WishlistItem, Error, CreateWishlistPayload>({
    mutationFn: async (payload) => {
      const { data } = await http.post<WishlistItem>(
        API.wishlist.create,
        payload,
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.list() });
      if (variables.book) {
        queryClient.invalidateQueries({ queryKey: wishlistKeys.byBook(variables.book) });
      }
    },
    onError: () => showErrorToast('Failed to add to wishlist'),
  });
}

export function useRemoveWishlistItem() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { id: string; bookId?: string }>({
    mutationFn: async ({ id }) => {
      await http.delete(API.wishlist.detail(id));
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.list() });
      if (variables.bookId) {
        queryClient.invalidateQueries({ queryKey: wishlistKeys.byBook(variables.bookId) });
      }
    },
    onError: () => showErrorToast('Failed to remove from wishlist'),
  });
}
