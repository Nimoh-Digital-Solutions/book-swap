import type { ReactElement } from 'react';

import { Spinner } from '@components/ui/Spinner';

import styles from './PageLoader.module.scss';

/**
 * PageLoader
 *
 * Full-viewport centred loading screen shown while the auth subsystem
 * bootstraps or a lazy route chunk is being fetched. Matches the auth
 * split-panel visual language (warm off-white background, brand logo mark,
 * animated spinner using brand purple).
 */
export function PageLoader(): ReactElement {
  return (
    <div className={styles.root} aria-busy="true" aria-live="polite">
      <div className={styles.inner}>
        <div className={styles.logoRow}>
          <span className={styles.logoIcon} aria-hidden="true">
            {/* Zap icon matching AuthBranding — inline SVG avoids an extra import */}
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 2L4.09 12.29A1 1 0 0 0 5 14h7v8l8.91-10.29A1 1 0 0 0 20 10h-7V2z" />
            </svg>
          </span>
          <span className={styles.logoName}>BOOKSWAP</span>
        </div>
        <div className={styles.spinnerWrap}>
          <Spinner size="lg" label="Loading application…" />
        </div>
      </div>
    </div>
  );
}

PageLoader.displayName = 'PageLoader';
