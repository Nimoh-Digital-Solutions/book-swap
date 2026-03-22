/**
 * book.schemas.ts
 *
 * Zod validation schemas for book-related forms.
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Create book schema
// ---------------------------------------------------------------------------

export const createBookSchema = z.object({
  isbn: z.string().max(13).optional().or(z.literal('')),
  title: z.string().min(1, 'Title is required').max(300),
  author: z.string().min(1, 'Author is required').max(200),
  description: z.string().max(2000).optional().or(z.literal('')),
  cover_url: z.string().url().optional().or(z.literal('')),
  condition: z.enum(['new', 'like_new', 'good', 'acceptable'], {
    error: 'Condition is required',
  }),
  genres: z.array(z.string()).max(3, 'You can select up to 3 genres').optional(),
  language: z.enum(['en', 'nl', 'de', 'fr', 'es', 'other'], {
    error: 'Language is required',
  }),
  notes: z.string().max(200).optional().or(z.literal('')),
  page_count: z.number().int().positive().nullable().optional(),
  publish_year: z.number().int().min(1000).max(2100).nullable().optional(),
});

export type CreateBookFormValues = z.infer<typeof createBookSchema>;

// ---------------------------------------------------------------------------
// Update book schema (all optional for partial update)
// ---------------------------------------------------------------------------

export const updateBookSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  author: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  cover_url: z.string().url().optional().or(z.literal('')),
  condition: z.enum(['new', 'like_new', 'good', 'acceptable']).optional(),
  genres: z.array(z.string()).max(3, 'You can select up to 3 genres').optional(),
  language: z.enum(['en', 'nl', 'de', 'fr', 'es', 'other']).optional(),
  notes: z.string().max(200).optional(),
  page_count: z.number().int().positive().nullable().optional(),
  publish_year: z.number().int().min(1000).max(2100).nullable().optional(),
  status: z.enum(['available', 'in_exchange', 'returned']).optional(),
});

export type UpdateBookFormValues = z.infer<typeof updateBookSchema>;

// ---------------------------------------------------------------------------
// Wishlist item schema
// ---------------------------------------------------------------------------

export const wishlistItemSchema = z
  .object({
    isbn: z.string().max(13).optional().or(z.literal('')),
    title: z.string().max(300).optional().or(z.literal('')),
    author: z.string().max(200).optional().or(z.literal('')),
    genre: z.string().max(50).optional().or(z.literal('')),
    cover_url: z.string().url().optional().or(z.literal('')),
  })
  .refine(
    data => !!(data.isbn || data.title || data.genre),
    {
      message: 'At least one of ISBN, title, or genre is required',
      path: ['title'],
    },
  );

export type WishlistItemFormValues = z.infer<typeof wishlistItemSchema>;
