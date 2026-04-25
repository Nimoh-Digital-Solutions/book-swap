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
        target.scrollIntoView({ behavior, block, inline: 'nearest' });
      };

      if (delay > 0) {
        window.setTimeout(fire, delay);
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
    return () => {
      node.removeEventListener('focusin', handleFocusIn);
    };
  }, [enabled, handleFocusIn]);

  return ref;
}
