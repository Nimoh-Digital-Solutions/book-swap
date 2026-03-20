import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useDocumentTitle } from '@hooks';
import { PATHS, routeMetadata } from '@routes/config/paths';

import styles from './HomePage.module.scss';

const HomePage = (): ReactElement => {
  const { t } = useTranslation();
  useDocumentTitle(routeMetadata[PATHS.HOME].title);

  return (
    <div className={styles.root}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('home.surfaces')}</h2>
        <div className={styles.surfaceSamples}>
          <div className={`${styles.surface} ${styles.surface1} ${styles.radShadow}`}>1</div>
          <div className={`${styles.surface} ${styles.surface2} ${styles.radShadow}`}>2</div>
          <div className={`${styles.surface} ${styles.surface3} ${styles.radShadow}`}>3</div>
          <div className={`${styles.surface} ${styles.surface4} ${styles.radShadow}`}>4</div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('home.typography')}</h2>
        <div className={styles.textSamples}>
          <h1 className={styles.text1}>
            <span className={`${styles.swatch} ${styles.brandSwatch} ${styles.radShadow}`} />
            Brand
          </h1>
          <h1 className={styles.text1}>
            <span className={`${styles.swatch} ${styles.text1Swatch} ${styles.radShadow}`} />
            Text 1
          </h1>
          <h1 className={styles.text2}>
            <span className={`${styles.swatch} ${styles.text2Swatch} ${styles.radShadow}`} />
            Text 2
          </h1>
          <p className={styles.text1}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
            tempor incididunt ut labore et dolore magna aliqua.
          </p>
          <p className={styles.text2}>
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi
            ut aliquip ex ea commodo consequat.
          </p>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
