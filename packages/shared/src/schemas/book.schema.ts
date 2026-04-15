import { z } from 'zod';

export const bookConditionSchema = z.enum(['new', 'like_new', 'good', 'acceptable']);
export const bookStatusSchema = z.enum(['available', 'in_exchange', 'returned']);
export const bookLanguageSchema = z.enum(['en', 'nl', 'de', 'fr', 'es', 'other']);

export const bookOwnerSchema = z.object({
  id: z.string(),
  username: z.string(),
  avatar: z.string().nullable(),
  neighborhood: z.string(),
  avg_rating: z.string(),
});

export const bookPhotoSchema = z.object({
  id: z.string(),
  image: z.string(),
  position: z.number(),
  created_at: z.string(),
});

export const bookListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  author: z.string(),
  cover_url: z.string(),
  condition: bookConditionSchema,
  language: bookLanguageSchema,
  status: bookStatusSchema,
  primary_photo: z.string().nullable(),
  owner: bookOwnerSchema,
  created_at: z.string(),
});

export const bookDetailSchema = bookListItemSchema.extend({
  isbn: z.string(),
  description: z.string(),
  genres: z.array(z.string()),
  notes: z.string(),
  page_count: z.number().nullable(),
  publish_year: z.number().nullable(),
  photos: z.array(bookPhotoSchema),
  updated_at: z.string(),
});

export const paginatedBooksSchema = z.object({
  count: z.number(),
  next: z.string().nullable(),
  previous: z.string().nullable(),
  results: z.array(bookListItemSchema),
});

export type BookListItemParsed = z.infer<typeof bookListItemSchema>;
export type BookDetailParsed = z.infer<typeof bookDetailSchema>;
export type PaginatedBooksParsed = z.infer<typeof paginatedBooksSchema>;
