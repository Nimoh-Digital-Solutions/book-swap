/**
 * wishlist.service.ts
 *
 * API wrappers for wishlist endpoints.
 * Consumed by TanStack Query hooks — never called directly from components.
 */
import { API } from '@configs/apiEndpoints';
import { http } from '@services';

import type {
  CreateWishlistPayload,
  PaginatedWishlist,
  WishlistItem,
} from '../types/book.types';

export const wishlistService = {
  /** List the authenticated user's wishlist items. */
  async list(): Promise<PaginatedWishlist> {
    const { data } = await http.get<PaginatedWishlist>(API.wishlist.list);
    return data;
  },

  /** Add a wishlist item. */
  async create(payload: CreateWishlistPayload): Promise<WishlistItem> {
    const { data } = await http.post<WishlistItem>(API.wishlist.create, payload);
    return data;
  },

  /** Remove a wishlist item. */
  async remove(id: string): Promise<void> {
    await http.delete(API.wishlist.detail(id));
  },
};
