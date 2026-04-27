import { http } from '@/services/http';
import { API } from '@/configs/apiEndpoints';
import type {
  WishlistItem,
  CreateWishlistPayload,
  PaginatedResponse,
} from '@/types';

export async function fetchWishlist(): Promise<
  PaginatedResponse<WishlistItem>
> {
  const { data } = await http.get<PaginatedResponse<WishlistItem>>(
    API.wishlist.list,
  );
  return data;
}

export async function fetchWishlistStatusForBook(
  bookId: string,
): Promise<WishlistItem | null> {
  const { data } = await http.get<PaginatedResponse<WishlistItem>>(
    API.wishlist.byBook(bookId),
  );
  return data.results?.[0] ?? null;
}

export async function addWishlistItem(
  payload: CreateWishlistPayload,
): Promise<WishlistItem> {
  const { data } = await http.post<WishlistItem>(
    API.wishlist.create,
    payload,
  );
  return data;
}

export async function removeWishlistItem(id: string): Promise<void> {
  await http.delete(API.wishlist.detail(id));
}
