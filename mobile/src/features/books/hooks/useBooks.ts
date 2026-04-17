import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { http } from '@/services/http';
import { API } from '@/configs/apiEndpoints';
import type { Book, PaginatedResponse } from '@/types';

export interface BrowseParams {
  lat?: number;
  lng?: number;
  radius?: number;
  search?: string;
  genre?: string;
}

export function useBrowseBooks(params: BrowseParams) {
  const apiParams: Record<string, string | number | undefined> = {
    lat: params.lat,
    lng: params.lng,
    radius: params.radius,
  };
  if (params.search) apiParams.search = params.search;
  if (params.genre) apiParams.genre = params.genre;

  return useInfiniteQuery({
    queryKey: ['browse', apiParams],
    queryFn: async ({ pageParam }) => {
      const { data } = await http.get<PaginatedResponse<BrowseBook>>(
        API.browse.list,
        { params: { ...apiParams, page: pageParam } },
      );
      return data;
    },
    initialPageParam: '1',
    getNextPageParam: (lastPage) =>
      lastPage.next ? new URL(lastPage.next).searchParams.get('page') ?? undefined : undefined,
    enabled: !!params.lat && !!params.lng,
  });
}

export function useBookDetail(bookId: string) {
  return useQuery({
    queryKey: ['book', bookId],
    queryFn: async () => {
      const { data } = await http.get<Book>(API.books.detail(bookId));
      return data;
    },
    enabled: !!bookId,
  });
}

export function useMyBooks() {
  return useQuery({
    queryKey: ['myBooks'],
    queryFn: async () => {
      const { data } = await http.get<PaginatedResponse<Book>>(API.books.list, {
        params: { owner: 'me' },
      });
      return data.results;
    },
  });
}

export interface CreateBookPayload {
  isbn?: string;
  title: string;
  author: string;
  description?: string;
  cover_url?: string;
  condition: 'new' | 'like_new' | 'good' | 'acceptable';
  genres?: string[];
  language: 'en' | 'nl' | 'de' | 'fr' | 'es' | 'other';
  notes?: string;
  page_count?: number | null;
  publish_year?: number | null;
}

export function useCreateBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateBookPayload) => {
      const { data } = await http.post<Book>(API.books.create, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBooks'] });
      queryClient.invalidateQueries({ queryKey: ['browse'] });
      queryClient.invalidateQueries({ queryKey: ['recentBooks'] });
      queryClient.invalidateQueries({ queryKey: ['nearbyCount'] });
    },
  });
}

export function useDeleteBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bookId: string) => {
      await http.delete(API.books.detail(bookId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBooks'] });
      queryClient.invalidateQueries({ queryKey: ['browse'] });
      queryClient.invalidateQueries({ queryKey: ['recentBooks'] });
      queryClient.invalidateQueries({ queryKey: ['nearbyCount'] });
    },
  });
}

export function useIsbnLookup(isbn: string) {
  return useQuery({
    queryKey: ['isbn', isbn],
    queryFn: async () => {
      const { data } = await http.get(API.books.isbnLookup, {
        params: { isbn },
      });
      return data as { title: string; author: string; isbn: string; cover_url?: string };
    },
    enabled: !!isbn,
  });
}

export interface NearbyCount {
  count: number;
  user_count: number;
  radius: number;
}

export interface BrowseBookOwner {
  id: string;
  username: string;
  avatar: string | null;
  neighborhood: string;
  avg_rating: string;
}

export interface BrowseBook {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  condition: string;
  language: string;
  status: string;
  primary_photo: string | null;
  owner: BrowseBookOwner;
  distance: number | null;
  created_at: string;
}

export function useRecentBooks(lat?: number, lng?: number, radiusM = 50000) {
  return useQuery({
    queryKey: ['recentBooks', lat, lng, radiusM],
    queryFn: async () => {
      const { data } = await http.get<PaginatedResponse<BrowseBook>>(
        API.browse.list,
        { params: { lat, lng, radius: radiusM, ordering: '-created_at' } },
      );
      return data.results;
    },
    enabled: lat != null && lng != null,
  });
}

export function useNearbyCount(lat?: number, lng?: number, radius = 10000) {
  return useQuery({
    queryKey: ['nearbyCount', lat, lng, radius],
    queryFn: async () => {
      const { data } = await http.get<NearbyCount>(API.browse.nearbyCount, {
        params: { lat, lng, radius },
      });
      return data;
    },
    enabled: lat != null && lng != null,
  });
}
