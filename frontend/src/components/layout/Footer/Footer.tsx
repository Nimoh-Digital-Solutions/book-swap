import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { APP_CONFIG } from '@configs';

import styles from './Footer.module.scss';

/**
 * Footer
 * Layout component
 */
export const Footer = ({ className }: { className?: string }): ReactElement => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className={className ? `${styles.root} ${className}` : styles.root}>
      <p>
        &copy; {currentYear} {APP_CONFIG.appName}. {t('footer.rights')}
      </p>
    </footer>
  );
};
