import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
} from 'react';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

export type DrawerSide = 'left' | 'right' | 'bottom' | 'top';

export interface DrawerProps {
  /** Whether the drawer is currently open. */
  open: boolean;
  /** Called with `false` when the drawer requests to close (backdrop, Escape, programmatic). */
  onOpenChange: (open: boolean) => void;
  /** Edge to slide in from. Defaults to `bottom` on phones, `right` on desktop is the typical pairing — pass explicitly. */
  side: DrawerSide;
  /** Drawer panel contents. */
  children: ReactNode;
  /** Accessible name for the dialog. Required for screen readers. */
  ariaLabel: string;
  /** Apply safe-area padding to the open edge. Defaults to true. */
  safeArea?: boolean;
  /** Additional classes for the panel itself (background, width/height, padding overrides). */
  panelClassName?: string;
  /** Optional id for the panel (also referenced via `aria-labelledby` if no `ariaLabel` is set elsewhere). */
  id?: string;
  /** Default `true`. Set to `false` to disable body scroll lock (rare). */
  lockScroll?: boolean;
}

/**
 * Drawer
 *
 * Reusable slide-in panel primitive (RESP-001 / 5.4 / Sprint C).
 *
 * Built on `motion/react` `AnimatePresence`. Replaces the per-feature
 * drawers that the codebase used to roll by hand (mobile nav,
 * `MobileFilterSheet`, `SwapFlowModal` full-screen sheet on phones).
 *
 * Behaviour:
 * - Backdrop click + Escape both call `onOpenChange(false)`.
 * - On open: locks body scroll and moves focus into the first
 *   focusable element inside the panel.
 * - On close: restores focus to whatever element was focused when the
 *   drawer opened (typically the trigger button).
 * - `prefers-reduced-motion` skips the slide animation but keeps the
 *   open/close state changes — no surprise instant pops or jank.
 * - Each open edge gets a sensible default — `pb-safe` on bottom,
 *   `pt-safe` on top, etc. — so iOS home-indicator overlap is handled.
 *
 * The component is *headless* aside from positioning + animation:
 * pass your own `panelClassName` for background, padding, max width,
 * etc. The default classes set up the slide direction and the safe
 * dimensions only.
 */
export function Drawer({
  open,
  onOpenChange,
  side,
  children,
  ariaLabel,
  safeArea = true,
  panelClassName = '',
  id,
  lockScroll = true,
}: DrawerProps): React.ReactElement {
  const generatedId = useId();
  const panelId = id ?? generatedId;
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const close = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) return;

    // Remember whatever was focused so we can restore on close.
    previouslyFocused.current =
      (document.activeElement as HTMLElement | null) ?? null;

    let previousOverflow = '';
    if (lockScroll) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKeyDown);

    // Move focus into the panel after the next paint so the slide-in
    // animation gets a chance to mount the first focusable element.
    const focusTimer = window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(
        'a, button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      first?.focus();
    }, 0);

    return () => {
      if (lockScroll) document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(focusTimer);
      // Restore focus to the trigger so keyboard users stay in place.
      previouslyFocused.current?.focus();
    };
  }, [open, close, lockScroll]);

  // Pre-compute the slide transform per side so the offscreen + onscreen
  // states are stable across renders (motion compares string refs).
  const initialTransform = (() => {
    switch (side) {
      case 'left': return { x: '-100%', y: 0 };
      case 'right': return { x: '100%', y: 0 };
      case 'top': return { x: 0, y: '-100%' };
      case 'bottom': return { x: 0, y: '100%' };
    }
  })();

  const positionClass = (() => {
    switch (side) {
      case 'left': return 'left-0 top-0 h-[100dvh]';
      case 'right': return 'right-0 top-0 h-[100dvh]';
      case 'top': return 'top-0 left-0 w-full';
      case 'bottom': return 'bottom-0 left-0 w-full';
    }
  })();

  const safeAreaClass = (() => {
    if (!safeArea) return '';
    switch (side) {
      case 'left': return 'pl-safe pt-safe pb-safe';
      case 'right': return 'pr-safe pt-safe pb-safe';
      case 'top': return 'pt-safe pl-safe pr-safe';
      case 'bottom': return 'pb-safe pl-safe pr-safe';
    }
  })();

  const motionDuration = prefersReducedMotion ? 0 : 0.22;

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50"
          // The backdrop + panel both live in this fixed wrapper so
          // pointer events route to whichever the user clicks.
        >
          <motion.div
            className="absolute inset-0 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: motionDuration }}
            onClick={close}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            className={`absolute ${positionClass} ${safeAreaClass} ${panelClassName}`}
            initial={initialTransform}
            animate={{ x: 0, y: 0 }}
            exit={initialTransform}
            transition={{ duration: motionDuration, ease: [0.32, 0.72, 0, 1] }}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
