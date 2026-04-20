import { http } from '@/services/http';
import { API } from '@/configs/apiEndpoints';
import type { Book, PaginatedResponse } from '@/types';

export interface CreateBookPayload {
  isbn?: string;
  title: string;
  author: string;
  description?: string;
  cover_url?: string;
  condition: 'new' | 'like_new' | 'good' | 'acceptable';
  genres?: string[];
  language: 'en' | 'nl' | 'de' | 'fr' | 'es' | 'other';
  swap_type: 'temporary' | 'permanent';
  notes?: string;
  page_count?: number | null;
  publish_year?: number | null;
}

export interface UpdateBookPayload {
  title?: string;
  author?: string;
  description?: string;
  condition?: CreateBookPayload['condition'];
  genres?: string[];
  language?: CreateBookPayload['language'];
  swap_type?: CreateBookPayload['swap_type'];
  notes?: string;
  status?: string;
}

export type IsbnLookupResult = {
  title: string;
  author: string;
  isbn: string;
  cover_url?: string;
};

/** Paginated owner listing (`owner` is a user id or `'me'`). */
export async function fetchBooks(owner: string): Promise<Book[]> {
  const { data } = await http.get<PaginatedResponse<Book>>(API.books.list, {
    params: { owner },
  });
  return data.results;
}

export async function fetchBookById(bookId: string): Promise<Book> {
  const { data } = await http.get<Book>(API.books.detail(bookId));
  return data;
}

export async function createBook(payload: CreateBookPayload): Promise<Book> {
  const { data } = await http.post<Book>(API.books.create, payload);
  return data;
}

export async function updateBook(
  bookId: string,
  payload: UpdateBookPayload,
): Promise<Book> {
  const { data } = await http.patch<Book>(API.books.detail(bookId), payload);
  return data;
}

export async function deleteBook(bookId: string): Promise<void> {
  await http.delete(API.books.detail(bookId));
}

export async function lookupIsbn(isbn: string): Promise<IsbnLookupResult> {
  const { data } = await http.get(API.books.isbnLookup, {
    params: { isbn },
  });
  return data as IsbnLookupResult;
}
