import type { BeforeInstallPromptEventLike } from '../types/pwa';

/**
 * Internal mutable state for the PWA install prompt.
 *
 * Isolated in its own module so tests can reset it by importing this object
 * and mutating its properties directly — without requiring a test-only export
 * to ship in the production bundle.
 *
 * Usage in tests:
 * ```ts
 * import { pwaState } from './_pwa-state';
 *
 * beforeEach(() => {
 *   pwaState.deferredInstallPrompt = null;
 *   pwaState.listenersRegistered   = false;
 * });
 * ```
 */
export const pwaState = {
  deferredInstallPrompt: null as BeforeInstallPromptEventLike | null,
  listenersRegistered: false,
};
