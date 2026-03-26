import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * useRouteAnnouncer
 *
 * Moves keyboard-focus to `#main-content` on every route change so that
 * screen-reader users are taken to the new page content immediately instead
 * of being left at the top of the DOM.
 *
 * Must be called inside a component that is rendered within a `<Router>` —
 * typically `AppLayout`.
 *
 * @see WCAG 2.1 SC 2.4.3 — Focus Order (Level A)
 */
export function useRouteAnnouncer(): void {
  const { pathname } = useLocation();

  useEffect(() => {
    const main = document.getElementById('main-content');
    if (main) {
      // tabIndex = -1 allows programmatic focus without adding the element
      // to the natural tab order.
      if (!main.hasAttribute('tabindex')) {
        main.setAttribute('tabindex', '-1');
      }
      main.focus({ preventScroll: true });
    }
  }, [pathname]);
}
