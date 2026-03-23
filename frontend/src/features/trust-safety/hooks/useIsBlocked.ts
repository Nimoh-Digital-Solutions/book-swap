/**
 * useIsBlocked.ts
 *
 * Derived hook that checks whether a specific user ID is in the
 * current user's blocked list.
 */
import { useMemo } from 'react';

import { useBlocks } from './useBlocks';

export function useIsBlocked(userId: string) {
  const { data } = useBlocks();

  const isBlocked = useMemo(() => {
    if (!data) return false;
    const results = 'results' in data ? data.results : [];
    return results.some((block) => block.blocked_user.id === userId);
  }, [data, userId]);

  return isBlocked;
}
