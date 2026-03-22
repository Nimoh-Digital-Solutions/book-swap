/**
 * isbn.service.ts
 *
 * API wrappers for ISBN lookup and external book search.
 * Consumed by TanStack Query hooks — never called directly from components.
 */
import { API } from '@configs/apiEndpoints';
import { http } from '@services';

import type { BookMetadata } from '../types/book.types';

export const isbnService = {
  /** Look up book metadata by ISBN. */
  async lookupIsbn(isbn: string): Promise<BookMetadata> {
    const url = `${API.books.isbnLookup}?isbn=${encodeURIComponent(isbn)}`;
    const { data } = await http.get<BookMetadata>(url);
    return data;
  },

  /** Search for books by title/author via Open Library proxy. */
  async searchExternal(query: string): Promise<BookMetadata[]> {
    const url = `${API.books.searchExternal}?q=${encodeURIComponent(query)}`;
    const { data } = await http.get<BookMetadata[]>(url);
    return data;
  },
};
