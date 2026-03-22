/**
 * bookKeys.ts
 *
 * TanStack Query key factory for the books feature.
 * Centralises cache keys so invalidation is always consistent.
 */
import type { BookListFilters } from '../types/book.types';

export const bookKeys = {
  all: ['books'] as const,
  lists: () => [...bookKeys.all, 'list'] as const,
  list: (filters?: BookListFilters) => [...bookKeys.lists(), filters ?? {}] as const,
  myShelf: () => [...bookKeys.all, 'my-shelf'] as const,
  details: () => [...bookKeys.all, 'detail'] as const,
  detail: (id: string) => [...bookKeys.details(), id] as const,
  isbnLookup: (isbn: string) => [...bookKeys.all, 'isbn', isbn] as const,
  externalSearch: (query: string) => [...bookKeys.all, 'search', query] as const,
};

export const wishlistKeys = {
  all: ['wishlist'] as const,
  list: () => [...wishlistKeys.all, 'list'] as const,
};
