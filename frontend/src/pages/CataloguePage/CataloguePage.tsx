import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useDocumentTitle } from '@hooks';
import { PATHS, routeMetadata } from '@routes/config/paths';

/**
 * CataloguePage — browse all available books in the community.
 */
export default function CataloguePage(): ReactElement {
  useDocumentTitle(routeMetadata[PATHS.CATALOGUE].title);
  const { t } = useTranslation();

  return (
    <section className="max-w-7xl mx-auto px-6 py-16" style={{ marginInline: 'auto' }}>
      <h1 className="text-3xl font-bold text-white mb-4">
        {t('catalogue.title', 'Browse Books')}
      </h1>
      <p className="text-[#8C9C92]">
        {t('catalogue.description', 'Discover books available for swap in your community. Listings coming soon.')}
      </p>
    </section>
  );
}
