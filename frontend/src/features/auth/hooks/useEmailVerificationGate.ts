/**
 * useEmailVerificationGate.ts
 *
 * Hook that checks whether the current user has verified their email.
 * Returns `{ isVerified, showPrompt }` — components use `showPrompt`
 * to render an inline verification prompt instead of allowing gated actions.
 */
import { useAuthStore } from '../stores/authStore';

export function useEmailVerificationGate() {
  const user = useAuthStore((s) => s.user);

  const isVerified = user?.email_verified === true;

  return {
    /** Whether the user's email is verified. */
    isVerified,
    /** True when an unverified user should see a "verify your email" prompt. */
    showPrompt: !!user && !isVerified,
  };
}
