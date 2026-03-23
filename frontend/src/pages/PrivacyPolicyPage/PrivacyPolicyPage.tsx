import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useDocumentTitle } from '@hooks';
import { PATHS, routeMetadata } from '@routes/config/paths';

export default function PrivacyPolicyPage(): ReactElement {
  const { t } = useTranslation('trust-safety');
  useDocumentTitle(routeMetadata[PATHS.PRIVACY_POLICY].title);

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-white">{t('privacy.title')}</h1>
      <p className="text-sm text-[#8C9C92]">
        {t('privacy.lastUpdated', { date: '2025-01-01' })}
      </p>

      <section className="space-y-4 text-[#C5CEC8] text-sm leading-relaxed">
        <h2 className="text-lg font-semibold text-white">
          1. Data We Collect
        </h2>
        <p>
          We collect only information needed to operate BookSwap: your name,
          email address, approximate location, book listings, exchange history,
          messages, and ratings you leave or receive.
        </p>

        <h2 className="text-lg font-semibold text-white">
          2. How We Use Your Data
        </h2>
        <p>
          Your data is used to facilitate book swaps in your community, show
          relevant listings, enable messaging between users, and improve the
          platform. We do not sell your data to third parties.
        </p>

        <h2 className="text-lg font-semibold text-white">3. Data Storage</h2>
        <p>
          Your data is stored securely in the European Union. We use encryption
          in transit (TLS) and at rest for sensitive information.
        </p>

        <h2 className="text-lg font-semibold text-white">4. Your Rights</h2>
        <p>
          Under the GDPR you have the right to access, correct, or delete your
          personal data at any time. You can download a copy of your data from
          the Settings page or delete your account entirely.
        </p>

        <h2 className="text-lg font-semibold text-white">5. Cookies</h2>
        <p>
          BookSwap uses essential cookies only — session authentication and CSRF
          protection. No tracking or advertising cookies are used.
        </p>

        <h2 className="text-lg font-semibold text-white">6. Contact</h2>
        <p>
          For privacy-related questions, contact us at privacy@bookswap.app.
        </p>
      </section>
    </main>
  );
}
