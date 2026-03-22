/**
 * book.service.ts
 *
 * Thin API wrappers for book endpoints.
 * Consumed by TanStack Query hooks — never called directly from components.
 */
import { API } from '@configs/apiEndpoints';
import { http } from '@services';

import type {
  Book,
  BookListFilters,
  BookPhoto,
  CreateBookPayload,
  PaginatedBooks,
  ReorderPhotosPayload,
  UpdateBookPayload,
} from '../types/book.types';

export const bookService = {
  /** List books with optional filters. */
  async list(filters?: BookListFilters): Promise<PaginatedBooks> {
    const params = new URLSearchParams();
    if (filters?.owner) params.set('owner', filters.owner);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.genre) params.set('genre', filters.genre);
    if (filters?.language) params.set('language', filters.language);
    if (filters?.search) params.set('search', filters.search);
    const qs = params.toString();
    const url = qs ? `${API.books.list}?${qs}` : API.books.list;
    const { data } = await http.get<PaginatedBooks>(url);
    return data;
  },

  /** Fetch a single book by ID. */
  async getDetail(id: string): Promise<Book> {
    const { data } = await http.get<Book>(API.books.detail(id));
    return data;
  },

  /** Create a new book listing. */
  async create(payload: CreateBookPayload): Promise<Book> {
    const { data } = await http.post<Book>(API.books.create, payload);
    return data;
  },

  /** Partially update a book listing. */
  async update(id: string, payload: UpdateBookPayload): Promise<Book> {
    const { data } = await http.patch<Book>(API.books.detail(id), payload);
    return data;
  },

  /** Delete a book listing. */
  async remove(id: string): Promise<void> {
    await http.delete(API.books.detail(id));
  },

  /** Upload a photo for a book. */
  async uploadPhoto(bookId: string, file: File): Promise<BookPhoto> {
    const formData = new FormData();
    formData.append('image', file);
    const { data } = await http.post<BookPhoto>(
      API.books.photos(bookId),
      formData,
    );
    return data;
  },

  /** Delete a photo from a book. */
  async deletePhoto(bookId: string, photoId: string): Promise<void> {
    await http.delete(API.books.photoDetail(bookId, photoId));
  },

  /** Reorder photos for a book. */
  async reorderPhotos(bookId: string, payload: ReorderPhotosPayload): Promise<BookPhoto[]> {
    const { data } = await http.patch<BookPhoto[]>(
      API.books.photosReorder(bookId),
      payload,
    );
    return data;
  },
};
