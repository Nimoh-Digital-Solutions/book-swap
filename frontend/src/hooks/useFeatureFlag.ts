import { useMemo } from 'react';

/**
 * Known feature flag names.
 *
 * Each flag maps to a `VITE_FF_<NAME>` environment variable.
 * Add new flags here as the project grows — the type system will
 * catch typos at call-sites.
 *
 * Can be upgraded to a remote provider (LaunchDarkly/Unleash) by
 * swapping the env-var lookup for an API call + cache.
 */
export type FeatureFlagName =
  | 'STORY_GENERATION'
  | 'DARK_MODE'
  | 'EXPERIMENTAL_UI';

/**
 * Read all `VITE_FF_*` env vars at module load time.
 * Vite statically replaces `import.meta.env` references at build-time.
 */
const FLAGS: Record<string, string | undefined> = {
  STORY_GENERATION: import.meta.env['VITE_FF_STORY_GENERATION'],
  DARK_MODE: import.meta.env['VITE_FF_DARK_MODE'],
  EXPERIMENTAL_UI: import.meta.env['VITE_FF_EXPERIMENTAL_UI'],
};

/**
 * Check whether a feature flag is enabled (non-hook version).
 *
 * Returns `true` when the corresponding env var equals `"true"` (case-insensitive).
 * This can be called outside of React components (e.g. in services/utilities).
 */
export function isFeatureEnabled(name: FeatureFlagName): boolean {
  return FLAGS[name]?.toLowerCase() === 'true';
}

/**
 * useFeatureFlag — React hook to check a feature flag at render time.
 *
 * The value is derived from `VITE_FF_<name>` and is stable for the
 * lifetime of the build (Vite inlines env vars at compile time), so
 * the hook itself is a thin wrapper that returns a memoised boolean.
 *
 * @example
 * ```tsx
 * function StoryButton() {
 *   const storyGenEnabled = useFeatureFlag('STORY_GENERATION');
 *   if (!storyGenEnabled) return null;
 *   return <button>Generate Story</button>;
 * }
 * ```
 */
export function useFeatureFlag(name: FeatureFlagName): boolean {
  return useMemo(() => isFeatureEnabled(name), [name]);
}
