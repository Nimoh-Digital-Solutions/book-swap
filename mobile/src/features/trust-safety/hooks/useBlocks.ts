import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { http } from "@/services/http";
import { API } from "@/configs/apiEndpoints";
import type { Block, PaginatedResponse } from "@/types";

const blockKeys = {
  all: ["blocks"] as const,
  list: () => [...blockKeys.all, "list"] as const,
};

export { blockKeys };

export function useBlocks() {
  return useQuery({
    queryKey: blockKeys.list(),
    queryFn: async () => {
      const { data } = await http.get<Block[] | PaginatedResponse<Block>>(
        API.blocks.list,
      );
      return Array.isArray(data) ? data : data.results;
    },
  });
}

export function useBlockUser() {
  const qc = useQueryClient();
  return useMutation<Block, Error, string>({
    mutationFn: async (blockedUserId) => {
      const { data } = await http.post<Block>(API.blocks.create, {
        blocked_user_id: blockedUserId,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: blockKeys.list() });
      qc.invalidateQueries({ queryKey: ["exchanges"] });
      qc.invalidateQueries({ queryKey: ["browse"] });
    },
  });
}

export function useUnblockUser() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (userId) => {
      await http.delete(API.blocks.delete(userId));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: blockKeys.list() });
      qc.invalidateQueries({ queryKey: ["exchanges"] });
      qc.invalidateQueries({ queryKey: ["browse"] });
    },
  });
}

export function useIsBlocked(userId: string | undefined) {
  const { data: blocks } = useBlocks();
  if (!userId || !blocks) return false;
  return blocks.some((b) => b.blocked_user.id === userId);
}
