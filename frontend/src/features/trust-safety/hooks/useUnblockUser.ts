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
      queryClient.invalidateQueries({ queryKey: blockKeys.all });
      queryClient.invalidateQueries({ queryKey: ['exchanges'] });
      queryClient.invalidateQueries({ queryKey: ['browse'] });
    },
  });
}
