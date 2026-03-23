/**
 * useBlocks.ts
 *
 * Query hook for the blocked users list.
 */
import { useQuery } from '@tanstack/react-query';

import { blockService } from '../services/blockService';
import { blockKeys } from './blockKeys';

export function useBlocks() {
  return useQuery({
    queryKey: blockKeys.list(),
    queryFn: () => blockService.list(),
  });
}
