import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

/**
 * Routes nested INSIDE a tab whose presence should hide the floating tab bar
 * (modal-feeling detail / capture screens). Kept as a constant so it's easy
 * to extend without touching the visibility logic.
 */
export const HIDDEN_CHILD_ROUTES = new Set([
  'Chat',
  'BookDetail',
  'ExchangeDetail',
  'UserProfile',
  'UserReviews',
  'AddBook',
  'ScanResult',
  'RequestSwap',
  'CounterOffer',
  'EditBook',
  'Notifications',
]);

/**
 * Tabs that hide the floating tab bar while they are the active tab
 * (full-bleed experiences where the pill would obscure content — the map
 * for Browse, the profile shell for ProfileTab).
 */
export const HIDE_BAR_WHEN_ACTIVE = new Set(['ProfileTab', 'BrowseTab']);

/**
 * Tabs that should never render as a button inside the floating bar.
 * `ProfileTab` is reached via the avatar in the app header (and Home tiles
 * / deep links), so it intentionally has no pill button. `BrowseTab` IS
 * a primary action and DOES render as a button — the bar simply auto-hides
 * once the user is on the map (see HIDE_BAR_WHEN_ACTIVE).
 */
export const EXCLUDED_FROM_BAR = new Set(['ProfileTab']);

/**
 * Back-compat alias — older code (and tests) reach for ALWAYS_HIDDEN_TABS
 * to mean "skip rendering this tab as a button". Point it at the more
 * narrowly-scoped EXCLUDED_FROM_BAR so removing BrowseTab from the bar
 * exclusion doesn't leak into auto-hide behaviour.
 */
export const ALWAYS_HIDDEN_TABS = EXCLUDED_FROM_BAR;

/**
 * Decide whether the floating tab bar should be visible given the current
 * navigation state.
 *
 * Pure function so it's trivially unit-testable from the colocated test file.
 */
export function computeVisibility(state: BottomTabBarProps['state']): boolean {
  const activeRoute = state.routes[state.index];
  if (!activeRoute) return false;
  if (HIDE_BAR_WHEN_ACTIVE.has(activeRoute.name)) return false;
  const focusedChild = getFocusedRouteNameFromRoute(activeRoute);
  if (focusedChild && HIDDEN_CHILD_ROUTES.has(focusedChild)) return false;
  return true;
}
