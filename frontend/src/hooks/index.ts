// Export all custom hooks from this file
export type { Breakpoint } from './useBreakpoint';
export { BREAKPOINTS, useBreakpoint, useIsBelow } from './useBreakpoint';
export { useClickOutside } from './useClickOutside';
export type { CurrentLocationResult } from './useCurrentLocation';
export { useCurrentLocation } from './useCurrentLocation';
export { useDebounce } from './useDebounce';
export { useDocumentTitle } from './useDocumentTitle';
export type { FeatureFlagName } from './useFeatureFlag';
export { isFeatureEnabled, useFeatureFlag } from './useFeatureFlag';
export type { HealthStatus, UseHealthCheckOptions } from './useHealthCheck';
export { useHealthCheck } from './useHealthCheck';
export { useLocalStorage } from './useLocalStorage';
export type { LocationMismatchResult } from './useLocationMismatch';
export { useLocationMismatch } from './useLocationMismatch';
export { useMediaQuery } from './useMediaQuery';
export { usePrevious } from './usePrevious';
export { usePwaUpdate } from './usePwaUpdate';
export { useRouteAnnouncer } from './useRouteAnnouncer';
export { useScrollIntoViewOnFocus } from './useScrollIntoViewOnFocus';
export { useTheme } from './useTheme';
export type { ToastItem, ToastVariant, UseToastReturn } from './useToast';
export { useToast } from './useToast';
export { useToggle } from './useToggle';
export type { UserCityResult } from './useUserCity';
export { useUserCity } from './useUserCity';
export type { WindowSize } from './useWindowSize';
export { useWindowSize } from './useWindowSize';

// API / server-state hooks
export { useApiMutation } from './useApiMutation';
export { useApiQuery } from './useApiQuery';
export { usePaginatedQuery } from './usePaginatedQuery';

// Network status (re-exported from tast-hooks package)
export type { NetworkStatus } from '@nimoh-digital-solutions/tast-hooks';
export { useIsOnline,useNetworkStatus } from '@nimoh-digital-solutions/tast-hooks';
