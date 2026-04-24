import type { ReactElement } from 'react';

import { logoMark } from '@assets';

import styles from './BrandedLoader.module.scss';

export type BrandedLoaderSize = 'sm' | 'md' | 'lg';

export interface BrandedLoaderProps {
  /** Visual size of the logo + spinner. Defaults to 'md'. */
  size?: BrandedLoaderSize;
  /** Optional loading copy shown below the logo. */
  label?: string;
  /**
   * If true, fills the parent container (height 100%) so it can be used
   * as an overlay inside cards, map frames, or content areas.
   * Defaults to true.
   */
  fillParent?: boolean;
  /** If true, applies a subtle dark backdrop (useful for map overlays). */
  withBackdrop?: boolean;
}

/**
 * BrandedLoader
 *
 * In-page branded loading indicator for content areas (maps, modals, lists).
 * Lighter than `PageLoader` (which is full-viewport for app boot / Suspense).
 *
 * Visual: BookSwap logo mark + animated gold ring + optional label.
 * Theme: dark surface (forest green) with brand gold accents.
 */
export function BrandedLoader({
  size = 'md',
  label,
  fillParent = true,
  withBackdrop = false,
}: BrandedLoaderProps): ReactElement {
  return (
    <div
      className={`${styles.root} ${fillParent ? styles.fill : ''} ${withBackdrop ? styles.backdrop : ''} ${styles[size]}`}
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={label ?? 'Loading'}
    >
      <div className={styles.logoWrap}>
        <span className={styles.ring} aria-hidden="true" />
        <img
          src={logoMark}
          alt=""
          aria-hidden="true"
          className={styles.logo}
          draggable={false}
        />
      </div>
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
}

BrandedLoader.displayName = 'BrandedLoader';
