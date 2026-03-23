import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useDocumentTitle } from '@hooks';
import { PATHS, routeMetadata } from '@routes/config/paths';

export default function TermsOfServicePage(): ReactElement {
  const { t } = useTranslation('trust-safety');
  useDocumentTitle(routeMetadata[PATHS.TERMS_OF_SERVICE].title);

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-white">{t('terms.title')}</h1>
      <p className="text-sm text-[#8C9C92]">
        {t('terms.lastUpdated', { date: '2025-01-01' })}
      </p>

      <section className="space-y-4 text-[#C5CEC8] text-sm leading-relaxed">
        <h2 className="text-lg font-semibold text-white">
          1. Acceptance of Terms
        </h2>
        <p>
          By using BookSwap you agree to these Terms of Service. If you do not
          agree, please do not use the platform.
        </p>

        <h2 className="text-lg font-semibold text-white">2. User Conduct</h2>
        <p>
          You agree to use BookSwap only for its intended purpose — exchanging
          physical books with other community members. You will not post
          misleading listings, harass other users, or use the platform for any
          illegal activity.
        </p>

        <h2 className="text-lg font-semibold text-white">
          3. Book Listings
        </h2>
        <p>
          You are responsible for the accuracy of your book listings, including
          condition descriptions. Misrepresented conditions may result in account
          restrictions.
        </p>

        <h2 className="text-lg font-semibold text-white">4. Exchanges</h2>
        <p>
          BookSwap facilitates connections between users but is not a party to
          any exchange. Users are responsible for arranging and completing swaps
          safely.
        </p>

        <h2 className="text-lg font-semibold text-white">
          5. Account Termination
        </h2>
        <p>
          We reserve the right to suspend or terminate accounts that violate
          these terms or community guidelines. You may delete your account at
          any time from the Settings page.
        </p>

        <h2 className="text-lg font-semibold text-white">
          6. Limitation of Liability
        </h2>
        <p>
          BookSwap is provided &ldquo;as is&rdquo; without warranties. We are
          not liable for any loss or damage arising from the use of the
          platform.
        </p>
      </section>
    </main>
  );
}
