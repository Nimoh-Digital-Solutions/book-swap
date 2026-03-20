import type { ReactElement } from 'react';

import { useDocumentTitle } from '@hooks';
import { routeMetadata } from '@routes/config/paths';
import { PATHS } from '@routes/config/paths';

/**
 * SettingsPage — placeholder page for account settings.
 */
export default function SettingsPage(): ReactElement {
  useDocumentTitle(routeMetadata[PATHS.SETTINGS].title);

  return (
    <main>
      <h1>Settings</h1>
      <p>Account settings will go here.</p>
    </main>
  );
}
