/**
 * books.test.tsx
 *
 * Integration tests for books hooks & services via MSW.
 */
import type { ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { TEST_BOOK, TEST_BOOK_LIST_ITEM, TEST_WISHLIST_ITEM } from '../../../test/mocks/handlers';
import { server } from '../../../test/mocks/server';
import { useAddWishlistItem } from '../hooks/useAddWishlistItem';
import { useBook } from '../hooks/useBook';
import { useBooks } from '../hooks/useBooks';
import { useCreateBook } from '../hooks/useCreateBook';
import { useISBNLookup } from '../hooks/useISBNLookup';
import { useMyShelf } from '../hooks/useMyShelf';
import { useRemoveWishlistItem } from '../hooks/useRemoveWishlistItem';
import { useWishlist } from '../hooks/useWishlist';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function createWrapper() {
  const client = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

// ---------------------------------------------------------------------------
// Books hooks
// ---------------------------------------------------------------------------

describe('useBooks', () => {
  it('fetches paginated book list', async () => {
    const { result } = renderHook(() => useBooks(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.results).toHaveLength(1);
    expect(result.current.data?.results[0]?.title).toBe(TEST_BOOK_LIST_ITEM.title);
  });
});

describe('useMyShelf', () => {
  it('fetches books for the current user (owner=me)', async () => {
    const { result } = renderHook(() => useMyShelf(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.results).toHaveLength(1);
  });
});

describe('useBook', () => {
  it('fetches a single book detail', async () => {
    const { result } = renderHook(() => useBook('book_001'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.title).toBe(TEST_BOOK.title);
    expect(result.current.data?.isbn).toBe(TEST_BOOK.isbn);
  });

  it('returns error when book not found', async () => {
    server.use(
      http.get('*/api/v1/books/:id/', () =>
        HttpResponse.json({ detail: 'Not found.' }, { status: 404 }),
      ),
    );
    const { result } = renderHook(() => useBook('nonexistent'), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCreateBook', () => {
  it('creates a book and returns the new record', async () => {
    const { result } = renderHook(() => useCreateBook(), { wrapper: createWrapper() });
    result.current.mutate({
      title: 'New Book',
      author: 'New Author',
      condition: 'new',
      language: 'en',
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.title).toBe('New Book');
  });
});

describe('useISBNLookup', () => {
  it('fetches book metadata by ISBN', async () => {
    const { result } = renderHook(
      () => useISBNLookup('9780743273565', true),
      { wrapper: createWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.title).toBe('The Great Gatsby');
  });

  it('does not fetch when disabled', () => {
    const { result } = renderHook(
      () => useISBNLookup('9780743273565', false),
      { wrapper: createWrapper() },
    );
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('does not fetch when ISBN is too short', () => {
    const { result } = renderHook(
      () => useISBNLookup('123', true),
      { wrapper: createWrapper() },
    );
    expect(result.current.fetchStatus).toBe('idle');
  });
});

// ---------------------------------------------------------------------------
// Wishlist hooks
// ---------------------------------------------------------------------------

describe('useWishlist', () => {
  it('fetches paginated wishlist', async () => {
    const { result } = renderHook(() => useWishlist(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.results).toHaveLength(1);
    expect(result.current.data?.results[0]?.title).toBe(TEST_WISHLIST_ITEM.title);
  });
});

describe('useAddWishlistItem', () => {
  it('adds a wishlist item', async () => {
    const { result } = renderHook(() => useAddWishlistItem(), { wrapper: createWrapper() });
    result.current.mutate({ title: 'Wanted Book', author: 'Someone' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useRemoveWishlistItem', () => {
  it('removes a wishlist item', async () => {
    const { result } = renderHook(() => useRemoveWishlistItem(), { wrapper: createWrapper() });
    result.current.mutate('wish_001');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
