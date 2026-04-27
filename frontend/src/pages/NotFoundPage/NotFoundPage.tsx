import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { SEOHead } from '@components';
import { PATHS, routeMetadata } from '@routes/config/paths';

import styles from './NotFoundPage.module.scss';

const NotFoundPage = (): ReactElement => {
  const { t } = useTranslation();

  return (
    <div className={styles.root}>
      <SEOHead
        title={routeMetadata[PATHS.NOT_FOUND].title}
        description={routeMetadata[PATHS.NOT_FOUND].description}
        path={PATHS.NOT_FOUND}
        noIndex
      />
      <section className={styles.errorSection}>
        <div className={styles.errorContent}>
          <div className={styles.errorCode}>{t('notFound.code')}</div>
          <h1 className={styles.errorTitle}>{t('notFound.title')}</h1>
          <p className={styles.errorDescription}>
            {t('notFound.description')}
          </p>
          <Link to={PATHS.HOME} className={styles.backLink}>
            {t('notFound.backToHome')}
          </Link>
        </div>
      </section>
    </div>
  );
};

export default NotFoundPage;
