import { Leaf, LockKeyhole } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import type { AuthView } from '../AuthSplitPanel/AuthSplitPanel';

import styles from './AuthBranding.module.scss';

export interface AuthBrandingProps {
  /** Controls which copy variant is shown. */
  view: AuthView;
  /** App / brand name shown in the logo lockup and headings. */
  appName?: string;
}

/** Stacked avatar placeholder row — uses inline SVG to avoid external URLs. */
function AvatarStack() {
  return (
    <div className={styles.avatarStack} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className={styles.avatar}>
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="20" fill={`hsl(${220 + i * 30}, 30%, 40%)`} />
            <circle cx="20" cy="16" r="7" fill="rgba(255,255,255,0.6)" />
            <ellipse cx="20" cy="34" rx="11" ry="8" fill="rgba(255,255,255,0.4)" />
          </svg>
        </div>
      ))}
    </div>
  );
}

/**
 * AuthBranding
 *
 * Renders the branding panel content for the auth split-panel layout.
 * Crossfades between login, register, and forgot-password copy variants
 * via AnimatePresence.
 */
export function AuthBranding({ view, appName = 'App' }: AuthBrandingProps) {
  const prefersReducedMotion = useReducedMotion();

  const fadeProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
        transition: { duration: 0.4 },
      };

  return (
    <div className={styles.root}>
      <AnimatePresence mode="wait">
        {view === 'login' && (
          <motion.div key="login-branding" className={styles.content} {...fadeProps}>
            {/* Logo lockup */}
            <div className={styles.logoRow}>
              <div className={styles.logoIcon}>
                <Leaf aria-hidden="true" />
              </div>
              <span className={styles.logoName}>{appName}</span>
            </div>

            <h2 className={styles.headline}>
              One platform. Endless possibilities.
            </h2>
            <p className={styles.tagline}>
              Sign in to access your workspace, collaborate with your team, and get
              more done — all in one place.
            </p>

            {/* Social proof */}
            <div className={styles.socialProof}>
              <AvatarStack />
              <p className={styles.socialProofText}>+500 users joined this month</p>
            </div>
          </motion.div>
        )}

        {view === 'register' && (
          <motion.div key="register-branding" className={styles.content} {...fadeProps}>
            {/* Logo lockup */}
            <div className={styles.logoRow}>
              <div className={styles.logoIcon}>
                <Leaf aria-hidden="true" />
              </div>
              <span className={styles.logoName}>{appName}</span>
            </div>

            <h2 className={styles.headline}>
              A platform that grows with you.
            </h2>
            <p className={styles.tagline}>
              Create your account and start collaborating, managing projects, and
              shipping faster today.
            </p>

            {/* Social proof card */}
            <div className={styles.glassCard}>
              <AvatarStack />
              <div className={styles.glassCardText}>
                <p className={styles.glassCardAccent}>+500 users</p>
                <p className={styles.glassCardSub}>Joined our community this month</p>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'forgot' && (
          <motion.div key="forgot-branding" className={styles.content} {...fadeProps}>
            {/* Logo lockup */}
            <div className={styles.logoRow}>
              <div className={styles.logoIcon}>
                <LockKeyhole aria-hidden="true" />
              </div>
              <span className={styles.logoName}>{appName}</span>
            </div>

            <h2 className={styles.headline}>
              Regain access in seconds.
            </h2>
            <p className={styles.tagline}>
              Enter your email address and we'll send you a secure link to reset
              your password and get back to work.
            </p>

            {/* Reassurance note */}
            <div className={styles.socialProof}>
              <p className={styles.socialProofText}>
                Reset links expire after 15 minutes for your security.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
