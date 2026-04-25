import { useSyncExternalStore } from 'react';

/**
 * Tailwind v4 default breakpoints, in CSS pixels.
 * Keep this in sync with `tailwind.css` if the theme ever overrides them.
 */
export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

const ORDER: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];

function getCurrentBreakpoint(): Breakpoint {
  if (typeof window === 'undefined') return 'lg';
  const w = window.innerWidth;
  let current: Breakpoint = 'xs';
  for (const bp of ORDER) {
    if (w >= BREAKPOINTS[bp]) current = bp;
  }
  return current;
}

/**
 * Subscription store backed by a single resize listener.
 *
 * `useSyncExternalStore` is the React 18+ recommended pattern for external
 * mutable sources — it avoids the tearing problems of `useState + useEffect`
 * and gives us a consistent server snapshot ('lg', the desktop default).
 *
 * The cache (`lastValue`) is refreshed *on first subscribe* in addition to
 * being kept in sync via the resize listener — otherwise the module would
 * cache the viewport at *import* time (typically before the test runner
 * adjusted `innerWidth`, or before the user rotated their device).
 */
const subscribers = new Set<() => void>();
let lastValue: Breakpoint =
  typeof window !== 'undefined' ? getCurrentBreakpoint() : 'lg';

function subscribe(callback: () => void): () => void {
  if (subscribers.size === 0 && typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize);
    // Refresh the cache when the first subscriber arrives so the very
    // first render reflects the current viewport, not the viewport at
    // module-import time.
    lastValue = getCurrentBreakpoint();
  }
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
    if (subscribers.size === 0 && typeof window !== 'undefined') {
      window.removeEventListener('resize', handleResize);
    }
  };
}

function handleResize(): void {
  const next = getCurrentBreakpoint();
  if (next !== lastValue) {
    lastValue = next;
    subscribers.forEach((cb) => {
      cb();
    });
  }
}

function getSnapshot(): Breakpoint {
  return lastValue;
}

function getServerSnapshot(): Breakpoint {
  return 'lg';
}

/**
 * useBreakpoint
 *
 * Returns the current Tailwind breakpoint name (`xs` / `sm` / `md` / `lg` /
 * `xl` / `2xl`). Re-renders only when the breakpoint actually *changes* —
 * not on every resize event.
 *
 * Use sparingly. CSS responsive utilities (`md:flex`) are still the
 * preferred way to switch *layout*; this hook is for the cases where the
 * *behaviour* must change too — e.g. "render the side panel as a Drawer
 * on mobile vs a fixed rail on desktop", or "use a Sheet vs a Modal".
 *
 * SSR-safe: returns `'lg'` on the server snapshot.
 */
export function useBreakpoint(): Breakpoint {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Convenience: true when the current viewport is below the given breakpoint.
 * `useIsBelow('md')` is true on phones (< 768 px) and false on tablet+.
 */
export function useIsBelow(bp: Exclude<Breakpoint, 'xs'>): boolean {
  const current = useBreakpoint();
  return BREAKPOINTS[current] < BREAKPOINTS[bp];
}
