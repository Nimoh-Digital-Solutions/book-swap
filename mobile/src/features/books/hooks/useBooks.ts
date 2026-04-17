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

export function useUserBooks(userId: string) {
  return useQuery({
    queryKey: ['userBooks', userId],
    queryFn: async () => {
      const { data } = await http.get<PaginatedResponse<Book>>(API.books.list, {
        params: { owner: userId },
      });
      return data.results;
    },
    enabled: !!userId,
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

export interface UpdateBookPayload {
  title?: string;
  author?: string;
  description?: string;
  condition?: CreateBookPayload['condition'];
  genres?: string[];
  language?: CreateBookPayload['language'];
  notes?: string;
  status?: string;
}

export function useUpdateBook(bookId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateBookPayload) => {
      const { data } = await http.patch<Book>(API.books.detail(bookId), payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book', bookId] });
      queryClient.invalidateQueries({ queryKey: ['myBooks'] });
      queryClient.invalidateQueries({ queryKey: ['browse'] });
      queryClient.invalidateQueries({ queryKey: ['recentBooks'] });
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

export function useUploadBookPhoto(bookId: string) {
  const queryClient = useQueryClient();
  return useMutation<BookPhoto, Error, string>({
    mutationFn: async (imageUri: string) => {
      const formData = new FormData();
      const filename = imageUri.split('/').pop() ?? 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const ext = match ? match[1] : 'jpg';
      const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
      formData.append('image', {
        uri: imageUri,
        name: filename,
        type: mime,
      } as unknown as Blob);
      const { data } = await http.post<BookPhoto>(
        API.books.photos(bookId),
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book', bookId] });
    },
  });
}

export function useDeleteBookPhoto(bookId: string) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (photoId: string) => {
      await http.delete(API.books.photoDetail(bookId, photoId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book', bookId] });
    },
  });
}

export function useReorderBookPhotos(bookId: string) {
  const queryClient = useQueryClient();
  return useMutation<BookPhoto[], Error, string[]>({
    mutationFn: async (photoIds: string[]) => {
      const { data } = await http.patch<BookPhoto[]>(
        API.books.photosReorder(bookId),
        { photo_ids: photoIds },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book', bookId] });
    },
  });
}

interface BookPhoto {
  id: string;
  image: string;
  position: number;
  created_at: string;
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
