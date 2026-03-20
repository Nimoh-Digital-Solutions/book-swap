import type { ReactElement } from 'react';
import { Outlet } from 'react-router-dom';

import { Footer, Header } from '@components';
import { useRouteAnnouncer } from '@hooks';

import styles from './AppLayout.module.scss';

const AppLayout = (): ReactElement => {
  useRouteAnnouncer();

  return (
    <div className={styles.root}>
      {/* Skip navigation — satisfies WCAG 2.1 SC 2.4.1 (Bypass Blocks, Level A) */}
      <a href="#main-content" className={styles.skipLink}>
        Skip to main content
      </a>

      <Header className={styles.header!} />

      <main id="main-content" className={styles.main}>
        <Outlet />
      </main>

      <Footer className={styles.footer!} />
    </div>
  );
};

export default AppLayout;
