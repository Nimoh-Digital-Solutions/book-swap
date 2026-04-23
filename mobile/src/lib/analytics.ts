import PostHog from 'posthog-react-native';
import { env } from '@/configs/env';

const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? '';
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com';

let posthog: PostHog | null = null;

export function initAnalytics() {
  if (!POSTHOG_API_KEY || __DEV__) return;
  posthog = new PostHog(POSTHOG_API_KEY, {
    host: POSTHOG_HOST,
    disabled: env.environment === 'development',
  });
}

export function identifyUser(userId: string, traits?: Record<string, string | number | boolean>) {
  posthog?.identify(userId, traits);
}

export function resetAnalytics() {
  posthog?.reset();
}

export function trackEvent(event: string, properties?: Record<string, string | number | boolean>) {
  posthog?.capture(event, properties);
}

export function optOut() {
  posthog?.optOut();
}

export function optIn() {
  posthog?.optIn();
}

export function isOptedOut(): boolean {
  return posthog?.optedOut ?? false;
}

// ── Typed event helpers ──────────────────────────────────────────────────────

export const Analytics = {
  signUp: (method: 'email' | 'google' | 'apple') =>
    trackEvent('sign_up', { method }),

  login: (method: 'email' | 'google' | 'apple') =>
    trackEvent('login', { method }),

  bookAdded: (hasIsbn: boolean, hasPhoto: boolean) =>
    trackEvent('book_added', { has_isbn: hasIsbn, has_photo: hasPhoto }),

  bookBrowsed: (filters: { genre?: string; radius?: number }) =>
    trackEvent('book_browsed', filters),

  exchangeRequested: (swapType: string) =>
    trackEvent('exchange_requested', { swap_type: swapType }),

  exchangeCompleted: (swapType: string) =>
    trackEvent('exchange_completed', { swap_type: swapType }),

  messageSent: (hasImage: boolean) =>
    trackEvent('message_sent', { has_image: hasImage }),

  ratingSubmitted: (score: number) =>
    trackEvent('rating_submitted', { score }),

  pushEnabled: () =>
    trackEvent('push_enabled'),

  searchPerformed: (query: string, resultCount: number) =>
    trackEvent('search_performed', { query_length: query.length, result_count: resultCount }),
} as const;
