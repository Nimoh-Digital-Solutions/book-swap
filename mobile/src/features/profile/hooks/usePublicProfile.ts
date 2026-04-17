import { useQuery } from '@tanstack/react-query';
import { http } from '@/services/http';
import { API } from '@/configs/apiEndpoints';
import type { UserPublicProfile } from '@/types';

const publicProfileKeys = {
  all: ['publicProfile'] as const,
  detail: (id: string) => [...publicProfileKeys.all, id] as const,
};

export { publicProfileKeys };

export function usePublicProfile(userId: string) {
  return useQuery<UserPublicProfile>({
    queryKey: publicProfileKeys.detail(userId),
    queryFn: async () => {
      const { data } = await http.get<UserPublicProfile>(
        API.users.detail(userId),
      );
      return data;
    },
    enabled: !!userId,
  });
}
