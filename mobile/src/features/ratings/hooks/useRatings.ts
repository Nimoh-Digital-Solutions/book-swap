import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { http } from "@/services/http";
import { API } from "@/configs/apiEndpoints";
import type {
  ExchangeRatingStatus,
  Rating,
  SubmitRatingPayload,
  PaginatedRatings,
} from "@/types";

const ratingKeys = {
  all: ["ratings"] as const,
  exchangeStatus: (id: string) =>
    [...ratingKeys.all, "exchange", id] as const,
  userRatings: (id: string) =>
    [...ratingKeys.all, "user", id] as const,
};

export { ratingKeys };

export function useExchangeRatingStatus(
  exchangeId: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ratingKeys.exchangeStatus(exchangeId),
    queryFn: async () => {
      const { data } = await http.get<ExchangeRatingStatus>(
        API.ratings.exchangeStatus(exchangeId),
      );
      return data;
    },
    enabled: !!exchangeId && (options?.enabled ?? true),
  });
}

export function useSubmitRating(exchangeId: string) {
  const qc = useQueryClient();
  return useMutation<Rating, Error, SubmitRatingPayload>({
    mutationFn: async (payload) => {
      const { data } = await http.post<Rating>(
        API.ratings.exchangeSubmit(exchangeId),
        payload,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ratingKeys.exchangeStatus(exchangeId),
      });
      qc.invalidateQueries({
        queryKey: ["exchanges", "detail", exchangeId],
      });
    },
  });
}

export function useUserRatings(userId: string) {
  return useInfiniteQuery<PaginatedRatings>({
    queryKey: ratingKeys.userRatings(userId),
    queryFn: async ({ pageParam }) => {
      const url = (pageParam as string) || API.ratings.userRatings(userId);
      const { data } = await http.get<PaginatedRatings>(url);
      return data;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next ?? undefined,
    enabled: !!userId,
  });
}
