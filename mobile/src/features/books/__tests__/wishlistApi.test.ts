import { API } from '@/configs/apiEndpoints';
import type { PaginatedResponse, WishlistItem } from '@/types';

jest.mock('@/services/http', () => ({
  http: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

import { http } from '@/services/http';
import {
  addWishlistItem,
  fetchWishlist,
  fetchWishlistStatusForBook,
  removeWishlistItem,
} from '@/features/books/wishlistApi';

const httpGet = http.get as jest.MockedFunction<typeof http.get>;
const httpPost = http.post as jest.MockedFunction<typeof http.post>;
const httpDelete = http.delete as jest.MockedFunction<typeof http.delete>;

function makeItem(overrides: Partial<WishlistItem> = {}): WishlistItem {
  return {
    id: 'w-1',
    book_id: 'b-1',
    title: 'T',
    author: 'A',
    isbn: '',
    genre: '',
    cover_url: '',
    created_at: '2020-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('wishlistApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetchWishlist gets list endpoint', async () => {
    const page: PaginatedResponse<WishlistItem> = {
      count: 1,
      next: null,
      previous: null,
      results: [makeItem()],
    };
    httpGet.mockResolvedValue({ data: page });

    const out = await fetchWishlist();
    expect(httpGet).toHaveBeenCalledWith(API.wishlist.list);
    expect(out).toEqual(page);
  });

  it('fetchWishlistStatusForBook returns first result or null', async () => {
    const item = makeItem();
    httpGet.mockResolvedValue({
      data: {
        count: 1,
        next: null,
        previous: null,
        results: [item],
      } satisfies PaginatedResponse<WishlistItem>,
    });

    const out = await fetchWishlistStatusForBook('b-1');
    expect(httpGet).toHaveBeenCalledWith(API.wishlist.byBook('b-1'));
    expect(out).toEqual(item);
  });

  it('fetchWishlistStatusForBook returns null when empty', async () => {
    httpGet.mockResolvedValue({
      data: {
        count: 0,
        next: null,
        previous: null,
        results: [],
      } satisfies PaginatedResponse<WishlistItem>,
    });

    const out = await fetchWishlistStatusForBook('b-2');
    expect(out).toBeNull();
  });

  it('addWishlistItem posts create endpoint', async () => {
    const payload = { book: 'b-1' };
    const created = makeItem();
    httpPost.mockResolvedValue({ data: created });

    const out = await addWishlistItem(payload);
    expect(httpPost).toHaveBeenCalledWith(API.wishlist.create, payload);
    expect(out).toEqual(created);
  });

  it('removeWishlistItem deletes detail URL', async () => {
    httpDelete.mockResolvedValue({ data: undefined });

    await removeWishlistItem('w-9');
    expect(httpDelete).toHaveBeenCalledWith(API.wishlist.detail('w-9'));
  });
});
