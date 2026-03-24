/**
 * useUnblockUser.ts
 *
 * Mutation hook for unblocking a user.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { blockService } from '../services/blockService';
import { blockKeys } from './blockKeys';

export function useUnblockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => blockService.remove(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: blockKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['exchanges'] });
      void queryClient.invalidateQueries({ queryKey: ['browse'] });
    },
  });
}
