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
 * Tabs that always hide the floating tab bar regardless of what's focused
 * inside them (full-bleed map / profile experiences).
 */
export const ALWAYS_HIDDEN_TABS = new Set(['ProfileTab', 'BrowseTab']);

/**
 * Decide whether the floating tab bar should be visible given the current
 * navigation state.
 *
 * Pure function so it's trivially unit-testable from the colocated test file.
 */
export function computeVisibility(state: BottomTabBarProps['state']): boolean {
  const activeRoute = state.routes[state.index];
  if (!activeRoute) return false;
  if (ALWAYS_HIDDEN_TABS.has(activeRoute.name)) return false;
  const focusedChild = getFocusedRouteNameFromRoute(activeRoute);
  if (focusedChild && HIDDEN_CHILD_ROUTES.has(focusedChild)) return false;
  return true;
}
