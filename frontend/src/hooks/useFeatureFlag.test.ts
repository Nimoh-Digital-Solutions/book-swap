import { describe, expect, it, vi } from 'vitest';

// Mock import.meta.env before importing the module
vi.stubEnv('VITE_FF_STORY_GENERATION', 'true');
vi.stubEnv('VITE_FF_DARK_MODE', 'false');
// VITE_FF_EXPERIMENTAL_UI is not set — should be disabled

// Dynamic import after env is stubbed
const { isFeatureEnabled } = await import('./useFeatureFlag');

describe('isFeatureEnabled', () => {
  it('returns true when env var is "true"', () => {
    expect(isFeatureEnabled('STORY_GENERATION')).toBe(true);
  });

  it('returns false when env var is "false"', () => {
    expect(isFeatureEnabled('DARK_MODE')).toBe(false);
  });

  it('returns false when env var is not set', () => {
    expect(isFeatureEnabled('EXPERIMENTAL_UI')).toBe(false);
  });
});
