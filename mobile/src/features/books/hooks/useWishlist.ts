import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '@/services/http';
import { API } from '@/configs/apiEndpoints';
import type { WishlistItem, CreateWishlistPayload, PaginatedResponse } from '@/types';

const wishlistKeys = {
  all: ['wishlist'] as const,
  list: () => [...wishlistKeys.all, 'list'] as const,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.list() });
    },
  });
}

export function useRemoveWishlistItem() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await http.delete(API.wishlist.detail(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wishlistKeys.list() });
    },
  });
}
