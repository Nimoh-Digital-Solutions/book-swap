import { type ReactElement, useCallback, useRef } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

import { routeChunkMap } from '@routes/config/routeChunkMap';
import { stripLocalePath } from '@routes/utils/localePath';

export interface PrefetchLinkProps extends LinkProps {
  /**
   * Delay (ms) before triggering the prefetch.
   * Prevents fetching on accidental mouse-overs.
   * @default 100
   */
  prefetchDelay?: number;
}

/**
 * PrefetchLink — a `<Link>` that pre-loads the target route's lazy chunk
 * on pointer hover or keyboard focus, eliminating the loading spinner on
 * navigation.
 *
 * Falls back to a regular `<Link>` for paths not in `routeChunkMap`.
 *
 * @example
 * ```tsx
 * <PrefetchLink to="/en/components">Components</PrefetchLink>
 * ```
 */
export function PrefetchLink({
  to,
  prefetchDelay = 100,
  onMouseEnter,
  onFocus,
  ...rest
}: PrefetchLinkProps): ReactElement {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const prefetchedRef = useRef(false);

  const prefetch = useCallback(() => {
    if (prefetchedRef.current) return;

    const rawPath = typeof to === 'string' ? to : to.pathname;
    const path = rawPath ? stripLocalePath(rawPath) : undefined;
    const factory = path ? routeChunkMap[path] : undefined;

    if (factory) {
      prefetchedRef.current = true;
      void factory();
    }
  }, [to]);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      timerRef.current = setTimeout(prefetch, prefetchDelay);
      onMouseEnter?.(e);
    },
    [prefetch, prefetchDelay, onMouseEnter],
  );

  const handleMouseLeave = useCallback(() => {
    if (timerRef.current !== undefined) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLAnchorElement>) => {
      prefetch();
      onFocus?.(e);
    },
    [prefetch, onFocus],
  );

  return (
    <Link
      to={to}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      {...rest}
    />
  );
}
