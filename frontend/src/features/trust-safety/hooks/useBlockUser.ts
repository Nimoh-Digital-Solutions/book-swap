/**
 * useBlockUser.ts
 *
 * Mutation hook for blocking a user.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { blockService } from '../services/blockService';
import { blockKeys } from './blockKeys';

export function useBlockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (blockedUserId: string) =>
      blockService.create({ blocked_user_id: blockedUserId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blockKeys.all });
      queryClient.invalidateQueries({ queryKey: ['exchanges'] });
      queryClient.invalidateQueries({ queryKey: ['browse'] });
    },
  });
}
