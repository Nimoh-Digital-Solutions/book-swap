/** Mirrors NetInfo branch in `useNetworkStatus` (native). */
export function netinfoIndicatesOnline(state: {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
}): boolean {
  return (
    state.isConnected === true &&
    (state.isInternetReachable === true || state.isInternetReachable === null)
  );
}

/** `true` when we treat the device as offline (matches hook return `isOffline`). */
export function computeIsOffline(
  isConnected: boolean | null,
  isInternetReachable: boolean | null,
): boolean {
  return isConnected === false || isInternetReachable === false;
}
