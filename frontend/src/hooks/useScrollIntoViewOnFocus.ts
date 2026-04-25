/**
 * useScrollIntoViewOnFocus
 *
 * Listens for `focusin` events inside the returned ref and scrolls the
 * focused interactive element into view. Designed for the iOS / Android
 * landscape-keyboard scenario (RESP-035): when the soft keyboard
 * occupies ~60 % of the viewport, a freshly-focused field can sit
 * underneath it. Browsers technically auto-scroll inputs into view, but
 * the heuristic is unreliable when the layout is inside a
 * `position: fixed` parent, an `overflow: hidden` container, or when
 * the focus moves between siblings without a re-layout.
 *
 * Only fires for `INPUT`, `TEXTAREA`, `SELECT`, and `[contenteditable]`
 * — i.e. elements that summon the keyboard. Buttons and links are
 * intentionally ignored to avoid jumpy scroll on regular keyboard nav.
 *
 * Usage:
 *
 * ```tsx
 * const formRef = useScrollIntoViewOnFocus<HTMLFormElement>();
 * return <form ref={formRef}>…</form>;
 * ```
 *
 * Pass `enabled: false` to suppress the behaviour temporarily (useful
 * when the form lives inside a modal that is currently closed).
 */
import { useCallback, useEffect, useRef } from 'react';

const KEYBOARD_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

interface UseScrollIntoViewOnFocusOptions {
  /** Disable the listener without removing the ref. Default `true`. */
  enabled?: boolean;
  /**
   * Where to align the focused element inside the viewport. Default
   * `'center'`. Use `'start'` if your layout has a fixed bottom bar
   * that overlaps `'center'`.
   */
  block?: ScrollLogicalPosition;
  /**
   * Delay before scrolling, in ms. The default of 250 ms gives mobile
   * keyboards time to animate in so we measure against the *post*-
   * keyboard viewport rather than the pre-keyboard one. Set to 0 to
   * scroll immediately.
   */
  delay?: number;
}

/**
 * Returns a ref that, when attached to any element, will scroll any
 * descendant `<input>` / `<textarea>` / `<select>` /
 * `[contenteditable]` into view when it receives focus.
 */
export function useScrollIntoViewOnFocus<T extends HTMLElement>(
  options: UseScrollIntoViewOnFocusOptions = {},
): React.RefObject<T | null> {
  const { enabled = true, block = 'center', delay = 250 } = options;
  const ref = useRef<T | null>(null);

  // Track pending deferred scrolls so we can cancel them on unmount.
  // Without this a test (or fast-navigating user) could let a 250 ms
  // timer fire after the host element has been removed, which produces
  // an unhandled `TypeError` in environments where `scrollIntoView`
  // isn't defined on the orphaned node (jsdom, very old WebViews).
  const pendingTimers = useRef<Set<number>>(new Set());

  const handleFocusIn = useCallback(
    (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const isKeyboardSummoner =
        KEYBOARD_TAGS.has(target.tagName) || target.isContentEditable;
      if (!isKeyboardSummoner) return;

      // Respect `prefers-reduced-motion` — instant scroll instead of smooth.
      const behavior: ScrollBehavior =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth';

      const fire = () => {
        // The element may have unmounted (e.g. autosuggest replacing
        // its own DOM). Re-check before scrolling.
        if (!document.contains(target)) return;
        // Defensive: `scrollIntoView` is universally implemented in real
        // browsers but is missing in jsdom (used by Vitest) and a handful
        // of legacy WebViews. Silently no-op in those environments rather
        // than throwing from inside a `setTimeout` callback that no
        // caller can catch.
        if (typeof target.scrollIntoView !== 'function') return;
        target.scrollIntoView({ behavior, block, inline: 'nearest' });
      };

      if (delay > 0) {
        const id = window.setTimeout(() => {
          pendingTimers.current.delete(id);
          fire();
        }, delay);
        pendingTimers.current.add(id);
      } else {
        fire();
      }
    },
    [block, delay],
  );

  useEffect(() => {
    const node = ref.current;
    if (!enabled || !node) return undefined;
    node.addEventListener('focusin', handleFocusIn);
    const timers = pendingTimers.current;
    return () => {
      node.removeEventListener('focusin', handleFocusIn);
      // Cancel any deferred scrolls scheduled during this lifecycle so
      // they don't fire against a torn-down DOM after unmount.
      for (const id of timers) {
        window.clearTimeout(id);
      }
      timers.clear();
    };
  }, [enabled, handleFocusIn]);

  return ref;
}
