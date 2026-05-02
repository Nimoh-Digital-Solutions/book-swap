import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { http } from '@/services/http';
import { API } from '@/configs/apiEndpoints';
import { showErrorToast } from '@/components/Toast';
import { useAuthStore } from '@/stores/authStore';
import type { Book, PaginatedResponse } from '@/types';
import {
  createBook as createBookApi,
  deleteBook as deleteBookApi,
  fetchBookById,
  fetchBooks,
  lookupIsbn as lookupIsbnApi,
  updateBook as updateBookApi,
  type CreateBookPayload,
  type UpdateBookPayload,
} from '@/features/books/bookApi';

export type { CreateBookPayload, UpdateBookPayload } from '@/features/books/bookApi';

/** Round to 3 decimal places (~111 m) to stabilise query keys across GPS drift. */
function roundCoord(v?: number): number | undefined {
  return v != null ? Math.round(v * 1e3) / 1e3 : undefined;
}

export interface BrowseParams {
  lat?: number;
  lng?: number;
  radius?: number;
  search?: string;
  genre?: string;
}

export function useBrowseBooks(params: BrowseParams) {
  const apiParams: Record<string, string | number | undefined> = {
    lat: roundCoord(params.lat),
    lng: roundCoord(params.lng),
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
    getNextPageParam: (lastPage) => {
      if (!lastPage.next) return undefined;
      try {
        return new URL(lastPage.next).searchParams.get('page') ?? undefined;
      } catch {
        const match = lastPage.next.match(/[?&]page=(\d+)/);
        return match?.[1] ?? undefined;
      }
    },
    enabled: !!params.lat && !!params.lng,
  });
}

export interface RadiusCounts {
  counts: Record<string, number>;
}

export function useRadiusCounts(lat?: number, lng?: number) {
  const rLat = roundCoord(lat);
  const rLng = roundCoord(lng);
  return useQuery<RadiusCounts>({
    queryKey: ['radiusCounts', rLat, rLng],
    queryFn: async () => {
      const { data } = await http.get<RadiusCounts>(API.browse.radiusCounts, {
        params: { lat: rLat, lng: rLng },
      });
      return data;
    },
    enabled: !!rLat && !!rLng,
    staleTime: 30_000,
  });
}

export function useBookDetail(bookId: string) {
  return useQuery({
    queryKey: ['book', bookId],
    queryFn: () => fetchBookById(bookId),
    enabled: !!bookId,
  });
}

export function useMyBooks() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['myBooks'],
    queryFn: () => fetchBooks('me'),
    enabled: isAuthenticated,
  });
}

export function useUserBooks(userId: string) {
  return useQuery({
    queryKey: ['userBooks', userId],
    queryFn: () => fetchBooks(userId),
    enabled: !!userId,
  });
}

export interface ExternalBookResult {
  isbn: string;
  title: string;
  author: string;
  description: string;
  cover_url: string;
  page_count: number | null;
  publish_year: number | null;
}

export function useExternalBookSearch(query: string) {
  return useQuery<ExternalBookResult[]>({
    queryKey: ['externalBookSearch', query],
    queryFn: async () => {
      const { data } = await http.get<ExternalBookResult[]>(
        API.books.searchExternal,
        { params: { q: query } },
      );
      return data;
    },
    enabled: query.trim().length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateBook() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (payload: CreateBookPayload) => createBookApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBooks'] });
      queryClient.invalidateQueries({ queryKey: ['browse'] });
      queryClient.invalidateQueries({ queryKey: ['recentBooks'] });
      queryClient.invalidateQueries({ queryKey: ['nearbyCount'] });
    },
    onError: () => showErrorToast(t('books.createError', 'Failed to create book')),
  });
}

export function useUpdateBook(bookId: string) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (payload: UpdateBookPayload) => updateBookApi(bookId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book', bookId] });
      queryClient.invalidateQueries({ queryKey: ['myBooks'] });
      queryClient.invalidateQueries({ queryKey: ['browse'] });
      queryClient.invalidateQueries({ queryKey: ['recentBooks'] });
    },
    onError: () => showErrorToast(t('books.updateError', 'Failed to update book')),
  });
}

export function useDeleteBook() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (bookId: string) => deleteBookApi(bookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBooks'] });
      queryClient.invalidateQueries({ queryKey: ['browse'] });
      queryClient.invalidateQueries({ queryKey: ['recentBooks'] });
      queryClient.invalidateQueries({ queryKey: ['nearbyCount'] });
    },
    onError: () => showErrorToast(t('books.deleteError', 'Failed to delete book')),
  });
}

export function useUploadBookPhoto(bookId: string) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
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
    onError: () => showErrorToast(t('books.photoUploadError', 'Failed to upload photo')),
  });
}

export function useDeleteBookPhoto(bookId: string) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation<void, Error, string>({
    mutationFn: async (photoId: string) => {
      await http.delete(API.books.photoDetail(bookId, photoId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book', bookId] });
    },
    onError: () => showErrorToast(t('books.photoDeleteError', 'Failed to delete photo')),
  });
}

export function useReorderBookPhotos(bookId: string) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
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
    onError: () => showErrorToast(t('books.photoReorderError', 'Failed to reorder photos')),
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
    queryFn: () => lookupIsbnApi(isbn),
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
  primary_thumbnail: string | null;
  owner: BrowseBookOwner;
  distance: number | null;
  location?: { type: string; coordinates: [number, number] } | null;
  created_at: string;
}

export function useRecentBooks(lat?: number, lng?: number, radiusM = 5000) {
  const rLat = roundCoord(lat);
  const rLng = roundCoord(lng);
  return useQuery({
    queryKey: ['recentBooks', rLat, rLng, radiusM],
    queryFn: async () => {
      const { data } = await http.get<PaginatedResponse<BrowseBook>>(
        API.browse.list,
        { params: { lat: rLat, lng: rLng, radius: radiusM, ordering: '-created_at' } },
      );
      return data.results;
    },
    enabled: rLat != null && rLng != null,
    staleTime: 5 * 60 * 1000,
  });
}

export function useNearbyCount(lat?: number, lng?: number, radius = 5000) {
  const rLat = roundCoord(lat);
  const rLng = roundCoord(lng);
  return useQuery({
    queryKey: ['nearbyCount', rLat, rLng, radius],
    queryFn: async () => {
      const { data } = await http.get<NearbyCount>(API.browse.nearbyCount, {
        params: { lat: rLat, lng: rLng, radius },
      });
      return data;
    },
    enabled: rLat != null && rLng != null,
    staleTime: 5 * 60 * 1000,
  });
}

// ── Community Stats ──────────────────────────────────────────────────

export interface ActivityFeedItem {
  type: 'new_listing' | 'completed_swap' | 'new_rating';
  user_name: string;
  partner_name?: string;
  book_title?: string | null;
  score?: number;
  neighbourhood: string;
  timestamp: string;
}

export interface CommunityStats {
  swaps_this_week: number;
  activity_feed: ActivityFeedItem[];
}

export function useCommunityStats(lat?: number, lng?: number, radius = 5000) {
  const rLat = roundCoord(lat);
  const rLng = roundCoord(lng);
  return useQuery<CommunityStats>({
    queryKey: ['communityStats', rLat, rLng, radius],
    queryFn: async () => {
      const { data } = await http.get<CommunityStats>(API.browse.communityStats, {
        params: { lat: rLat, lng: rLng, radius },
      });
      return data;
    },
    enabled: rLat != null && rLng != null,
    staleTime: 60_000,
  });
}
