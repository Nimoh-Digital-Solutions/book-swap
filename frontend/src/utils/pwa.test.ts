import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { pwaState } from './_pwa-state';
import type { BeforeInstallPromptEventLike } from './pwa';
import {
  canPromptPWAInstall,
  getAppVersionFromSW,
  getConnectionType,
  getDisplayMode,
  isAndroid,
  isIOS,
  isPWA,
  isSlowConnection,
  promptPWAInstall,
  registerPWAInstallPromptListener,
  supportsServiceWorker,
} from './pwa';

// ---------------------------------------------------------------------------
// Test-only types for message-channel mocks
// ---------------------------------------------------------------------------
interface MockMessagePort {
  onmessage: null | ((e: Pick<MessageEvent<unknown>, 'data'>) => void);
}
interface MockMessageChannel {
  port1: MockMessagePort;
  port2: Record<string, never>;
}

type MatchMediaMock = (query: string) => MediaQueryList;

function createMatchMediaMock(matchesFor: Record<string, boolean>): MatchMediaMock {
  return (query: string) =>
    ({
      matches: Boolean(matchesFor[query]),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }) as unknown as MediaQueryList;
}

describe('pwa utils', () => {
  const originalUserAgent = navigator.userAgent;
  const originalMaxTouchPoints = (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints;

  beforeEach(() => {
    // Reset internal state directly via the exported state object —
    // no test-only export needed in the production bundle.
    pwaState.deferredInstallPrompt = null;
    pwaState.listenersRegistered   = false;

    vi.stubGlobal('matchMedia', createMatchMediaMock({}));

    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    });

    Object.defineProperty(navigator, 'standalone', {
      value: undefined,
      configurable: true,
    });

    // Ensure deterministic maxTouchPoints for iPadOS detection tests
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: originalMaxTouchPoints ?? 0,
      configurable: true,
    });

    // Clear connection by default
    Object.defineProperty(navigator, 'connection', {
      value: undefined,
      configurable: true,
    });

    // Clear serviceWorker by default (note: util now checks getRegistration)
    Object.defineProperty(navigator, 'serviceWorker', {
      value: undefined,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();

    // restore touch points
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: originalMaxTouchPoints ?? 0,
      configurable: true,
    });
  });

  describe('PWA install prompt flow', () => {
    it('captures beforeinstallprompt event and allows prompting', async () => {
      registerPWAInstallPromptListener();

      const prompt = vi.fn().mockResolvedValue(undefined);
      const userChoice = Promise.resolve({
        outcome: 'accepted' as const,
        platform: 'web',
      });

      const event = Object.assign(new Event('beforeinstallprompt'), {
        preventDefault: vi.fn(),
        prompt,
        userChoice,
      }) as unknown as BeforeInstallPromptEventLike;

      window.dispatchEvent(event);

      expect(canPromptPWAInstall()).toBe(true);

      const result = await promptPWAInstall();

      expect(prompt).toHaveBeenCalledTimes(1);
      expect(result).toBe('accepted');
      expect(canPromptPWAInstall()).toBe(false);
    });

    it('returns null when promptPWAInstall is called without availability', async () => {
      await expect(promptPWAInstall()).resolves.toBeNull();
    });

    it('handles prompt errors gracefully', async () => {
      registerPWAInstallPromptListener();

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const event = Object.assign(new Event('beforeinstallprompt'), {
        preventDefault: vi.fn(),
        prompt: vi.fn().mockRejectedValue(new Error('boom')),
        userChoice: Promise.resolve({
          outcome: 'dismissed' as const,
          platform: 'web',
        }),
      }) as unknown as BeforeInstallPromptEventLike;

      window.dispatchEvent(event);

      await expect(promptPWAInstall()).resolves.toBeNull();
      expect(warnSpy).toHaveBeenCalled();
      expect(canPromptPWAInstall()).toBe(false);
    });
  });

  describe('isPWA', () => {
    it('returns true when display-mode is standalone', () => {
      vi.stubGlobal('matchMedia', createMatchMediaMock({ '(display-mode: standalone)': true }));

      expect(isPWA()).toBe(true);
    });

    it('returns true on iOS navigator.standalone', () => {
      Object.defineProperty(navigator, 'standalone', {
        value: true,
        configurable: true,
      });

      expect(isPWA()).toBe(true);
    });

    it('returns false otherwise', () => {
      expect(isPWA()).toBe(false);
    });
  });

  describe('getDisplayMode', () => {
    it('returns standalone when display-mode is standalone', () => {
      vi.stubGlobal('matchMedia', createMatchMediaMock({ '(display-mode: standalone)': true }));

      expect(getDisplayMode()).toBe('standalone');
    });

    it('returns fullscreen when display-mode is fullscreen', () => {
      vi.stubGlobal('matchMedia', createMatchMediaMock({ '(display-mode: fullscreen)': true }));

      expect(getDisplayMode()).toBe('fullscreen');
    });

    it('returns minimal-ui when display-mode is minimal-ui', () => {
      vi.stubGlobal(
        'matchMedia',
        createMatchMediaMock({
          '(display-mode: minimal-ui)': true,
        })
      );

      expect(getDisplayMode()).toBe('minimal-ui');
    });

    it('returns browser by default', () => {
      expect(getDisplayMode()).toBe('browser');
    });
  });

  describe('platform detection', () => {
    it('detects iOS by UA', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        configurable: true,
      });

      expect(isIOS()).toBe(true);
      expect(isAndroid()).toBe(false);
    });

    it('detects iPadOS (Macintosh + touch points)', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        configurable: true,
      });
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 5,
        configurable: true,
      });

      expect(isIOS()).toBe(true);
    });

    it('detects Android by UA', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 14; Pixel 8)',
        configurable: true,
      });

      expect(isAndroid()).toBe(true);
      expect(isIOS()).toBe(false);
    });
  });

  describe('service worker support', () => {
    it('returns true when serviceWorker.getRegistration exists', () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: { getRegistration: vi.fn() },
        configurable: true,
      });

      expect(supportsServiceWorker()).toBe(true);
    });

    it('returns false when serviceWorker is missing/unusable', () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        configurable: true,
      });

      expect(supportsServiceWorker()).toBe(false);
    });
  });

  describe('connection detection', () => {
    it('returns effective connection type', () => {
      Object.defineProperty(navigator, 'connection', {
        value: { effectiveType: '4g' },
        configurable: true,
      });

      expect(getConnectionType()).toBe('4g');
    });

    it('returns unknown when connection missing', () => {
      expect(getConnectionType()).toBe('unknown');
    });

    it('detects slow connection', () => {
      Object.defineProperty(navigator, 'connection', {
        value: { effectiveType: '2g' },
        configurable: true,
      });

      expect(isSlowConnection()).toBe(true);
    });
  });

  describe('getAppVersionFromSW', () => {
    it('returns null when service workers are not supported', async () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        configurable: true,
      });

      await expect(getAppVersionFromSW()).resolves.toBeNull();
    });

    it('returns null when there is no active SW', async () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          getRegistration: vi.fn().mockResolvedValue({ active: null }),
        },
        configurable: true,
      });

      await expect(getAppVersionFromSW()).resolves.toBeNull();
    });

    it('returns version from service worker via messaging', async () => {
      vi.useFakeTimers();

      const postMessage = vi.fn();
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          getRegistration: vi.fn().mockResolvedValue({
            active: { postMessage },
          }),
        },
        configurable: true,
      });

      // Capture the channel instance created inside the util
      // eslint-disable-next-line prefer-const
      let createdChannel!: MockMessageChannel;

      vi.stubGlobal('MessageChannel', function MessageChannelMock(this: unknown) {
        createdChannel = {
          port1: { onmessage: null },
          port2: {},
        };
        return createdChannel;
      } as unknown as typeof MessageChannel);

      const promise = getAppVersionFromSW(1000);

      // Allow the internal await getRegistration() to resolve
      await Promise.resolve();

      // Ensure handler is attached
      expect(createdChannel).toBeTruthy();
      expect(typeof createdChannel.port1.onmessage).toBe('function');

      // Simulate SW response
      createdChannel.port1.onmessage!({ data: '1.2.3' });

      await expect(promise).resolves.toBe('1.2.3');

      vi.useRealTimers();
    });

    it('resolves to null when the timeout fires before SW responds (FA-M15)', async () => {
      vi.useFakeTimers();

      const postMessage = vi.fn();
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          getRegistration: vi.fn().mockResolvedValue({ active: { postMessage } }),
        },
        configurable: true,
      });

      vi.stubGlobal('MessageChannel', function MessageChannelMock(this: unknown) {
        return {
          port1: { onmessage: null },
          port2: {},
        };
      } as unknown as typeof MessageChannel);

      const promise = getAppVersionFromSW(1000);

      // Let getRegistration() settle
      await Promise.resolve();
      await Promise.resolve();

      // Advance past the timeout
      vi.advanceTimersByTime(1001);

      await expect(promise).resolves.toBeNull();

      vi.useRealTimers();
    });

    it('resolves to null when the SW sends a non-string response (FA-M15)', async () => {
      vi.useFakeTimers();

      const postMessage = vi.fn();
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          getRegistration: vi.fn().mockResolvedValue({ active: { postMessage } }),
        },
        configurable: true,
      });

      let createdChannel!: MockMessageChannel;
      vi.stubGlobal('MessageChannel', function MessageChannelMock(this: unknown) {
        createdChannel = {
          port1: { onmessage: null },
          port2: {},
        };
        return createdChannel;
      } as unknown as typeof MessageChannel);

      const promise = getAppVersionFromSW(1000);

      await Promise.resolve();

      // Send a non-string value (e.g. an object)
      createdChannel.port1.onmessage!({ data: { version: '1.2.3' } });

      await expect(promise).resolves.toBeNull();

      vi.useRealTimers();
    });

    it('returns null when getRegistration throws', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          getRegistration: vi.fn().mockRejectedValue(new Error('SW fail')),
        },
        configurable: true,
      });

      await expect(getAppVersionFromSW()).resolves.toBeNull();
      expect(warnSpy).toHaveBeenCalled();
    });
  });
});
