import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { http } from '@/services/http';
import { API } from '@/configs/apiEndpoints';
import { showErrorToast } from '@/components/Toast';
import { useAuthStore } from '@/stores/authStore';
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
  return useQuery<RadiusCounts>({
    queryKey: ['radiusCounts', lat, lng],
    queryFn: async () => {
      const { data } = await http.get<RadiusCounts>(API.browse.radiusCounts, {
        params: { lat, lng },
      });
      return data;
    },
    enabled: !!lat && !!lng,
    staleTime: 30_000,
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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['myBooks'],
    queryFn: async () => {
      const { data } = await http.get<PaginatedResponse<Book>>(API.books.list, {
        params: { owner: 'me' },
      });
      return data.results;
    },
    enabled: isAuthenticated,
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
    onError: () => showErrorToast('Failed to create book'),
  });
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
    onError: () => showErrorToast('Failed to update book'),
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
    onError: () => showErrorToast('Failed to delete book'),
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
    onError: () => showErrorToast('Failed to upload photo'),
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
    onError: () => showErrorToast('Failed to delete photo'),
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
    onError: () => showErrorToast('Failed to reorder photos'),
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

export function useRecentBooks(lat?: number, lng?: number, radiusM = 5000) {
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

export function useNearbyCount(lat?: number, lng?: number, radius = 5000) {
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
  return useQuery<CommunityStats>({
    queryKey: ['communityStats', lat, lng, radius],
    queryFn: async () => {
      const { data } = await http.get<CommunityStats>(API.browse.communityStats, {
        params: { lat, lng, radius },
      });
      return data;
    },
    enabled: lat != null && lng != null,
    staleTime: 60_000,
  });
}
