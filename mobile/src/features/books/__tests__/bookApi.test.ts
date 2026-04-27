import { API } from '@/configs/apiEndpoints';
import type { Book, PaginatedResponse } from '@/types';

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
  createBook,
  deleteBook,
  fetchBookById,
  fetchBooks,
  lookupIsbn,
  updateBook,
  type CreateBookPayload,
} from '@/features/books/bookApi';

const httpGet = http.get as jest.MockedFunction<typeof http.get>;
const httpPost = http.post as jest.MockedFunction<typeof http.post>;
const httpPatch = http.patch as jest.MockedFunction<typeof http.patch>;
const httpDelete = http.delete as jest.MockedFunction<typeof http.delete>;

function makeBook(overrides: Partial<Book> = {}): Book {
  return {
    id: 'book-1',
    owner: 'user-1',
    title: 'T',
    author: 'A',
    isbn: '9780000000000',
    description: '',
    condition: 'good',
    genres: [],
    language: 'en',
    status: 'available',
    swap_type: 'temporary',
    photos: [],
    is_available: true,
    created_at: '2020-01-01T00:00:00Z',
    updated_at: '2020-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('bookApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetchBooks requests list with owner and returns results', async () => {
    const results = [makeBook()];
    httpGet.mockResolvedValue({
      data: { count: 1, next: null, previous: null, results } satisfies PaginatedResponse<Book>,
    });

    const out = await fetchBooks('me');
    expect(httpGet).toHaveBeenCalledWith(API.books.list, { params: { owner: 'me' } });
    expect(out).toEqual(results);
  });

  it('fetchBookById requests detail URL', async () => {
    const book = makeBook();
    httpGet.mockResolvedValue({ data: book });

    const out = await fetchBookById('book-1');
    expect(httpGet).toHaveBeenCalledWith(API.books.detail('book-1'));
    expect(out).toEqual(book);
  });

  it('createBook posts payload to create endpoint', async () => {
    const payload: CreateBookPayload = {
      title: 'N',
      author: 'M',
      condition: 'like_new',
      language: 'en',
      swap_type: 'permanent',
    };
    const created = makeBook({ title: 'N' });
    httpPost.mockResolvedValue({ data: created });

    const out = await createBook(payload);
    expect(httpPost).toHaveBeenCalledWith(API.books.create, payload);
    expect(out).toEqual(created);
  });

  it('updateBook patches detail URL', async () => {
    const updated = makeBook({ title: 'New' });
    httpPatch.mockResolvedValue({ data: updated });

    const out = await updateBook('book-1', { title: 'New' });
    expect(httpPatch).toHaveBeenCalledWith(API.books.detail('book-1'), { title: 'New' });
    expect(out).toEqual(updated);
  });

  it('deleteBook deletes detail URL', async () => {
    httpDelete.mockResolvedValue({ data: undefined });

    await deleteBook('book-1');
    expect(httpDelete).toHaveBeenCalledWith(API.books.detail('book-1'));
  });

  it('lookupIsbn requests isbn-lookup with params', async () => {
    const meta = { title: 'X', author: 'Y', isbn: '978123', cover_url: 'https://c' };
    httpGet.mockResolvedValue({ data: meta });

    const out = await lookupIsbn('978123');
    expect(httpGet).toHaveBeenCalledWith(API.books.isbnLookup, { params: { isbn: '978123' } });
    expect(out).toEqual(meta);
  });
});
