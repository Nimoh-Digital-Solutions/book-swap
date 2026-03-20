import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { usePwaUpdate } from '@hooks/usePwaUpdate';

import styles from './PwaUpdateBanner.module.scss';

/**
 * PwaUpdateBanner
 *
 * A non-blocking banner shown when a new service-worker version is
 * detected.  The user can click "Update now" to reload with the new
 * build, or dismiss the banner to stay on the current version.
 *
 * Placement: render once at the top level of the app (e.g. inside
 * `<App>`).  The component is self-contained — it listens for the
 * update via `usePwaUpdate()`.
 */
export function PwaUpdateBanner(): ReactElement | null {
  const { t } = useTranslation();
  const { showUpdate, applyUpdate, dismissUpdate } = usePwaUpdate();

  if (!showUpdate) return null;

  return (
    <div className={styles.banner} role="alert" aria-live="assertive">
      <span className={styles.message}>{t('pwa.updateAvailable')}</span>
      <button
        type="button"
        className={styles.action}
        onClick={applyUpdate}
      >
        {t('pwa.updateAction')}
      </button>
      <button
        type="button"
        className={styles.dismiss}
        onClick={dismissUpdate}
        aria-label={t('app.dismiss')}
      >
        ✕
      </button>
    </div>
  );
}
