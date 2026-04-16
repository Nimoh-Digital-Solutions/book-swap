import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { http } from '@/services/http';
import { API } from '@/configs/apiEndpoints';
import type { Book, PaginatedResponse } from '@/types';

export function useBrowseBooks(params: {
  lat?: number;
  lng?: number;
  radius?: number;
}) {
  return useInfiniteQuery({
    queryKey: ['browse', params],
    queryFn: async ({ pageParam }) => {
      const { data } = await http.get<PaginatedResponse<Book>>(
        API.browse.list,
        { params: { ...params, page: pageParam } },
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
      const { data } = await http.get<PaginatedResponse<Book>>(API.books.list);
      return data.results;
    },
  });
}

export function useCreateBook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await http.post<Book>(API.books.create, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBooks'] });
      queryClient.invalidateQueries({ queryKey: ['browse'] });
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
