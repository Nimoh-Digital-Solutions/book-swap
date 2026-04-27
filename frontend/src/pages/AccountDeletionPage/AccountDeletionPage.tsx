import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { SEOHead } from '@components';
import { LocaleLink } from '@components/common/LocaleLink/LocaleLink';
import { PATHS, routeMetadata } from '@routes/config/paths';

export default function AccountDeletionPage(): ReactElement {
  const { t } = useTranslation('trust-safety');

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <SEOHead
        title={routeMetadata[PATHS.ACCOUNT_DELETION].title}
        description={routeMetadata[PATHS.ACCOUNT_DELETION].description}
        path={PATHS.ACCOUNT_DELETION}
      />
      <h1 className="text-2xl font-bold text-white">
        {t('accountDeletion.title', 'Account & Data Deletion')}
      </h1>

      <section className="space-y-4 text-[#C5CEC8] text-sm leading-relaxed">
        <p>
          {t(
            'accountDeletion.intro',
            'BookSwap respects your right to control your personal data. You can request full deletion of your account and all associated data at any time.',
          )}
        </p>

        <h2 className="text-lg font-semibold text-white">
          {t('accountDeletion.howTitle', 'How to Delete Your Account')}
        </h2>

        <div className="space-y-3">
          <h3 className="font-semibold text-[#8C9C92]">
            {t('accountDeletion.inAppTitle', 'Option 1: In-app (recommended)')}
          </h3>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>{t('accountDeletion.step1', 'Open BookSwap and log in to your account.')}</li>
            <li>{t('accountDeletion.step2', 'Go to Settings.')}</li>
            <li>{t('accountDeletion.step3', 'Scroll to the bottom and tap "Delete Account".')}</li>
            <li>{t('accountDeletion.step4', 'Confirm with your password.')}</li>
          </ol>

          <h3 className="font-semibold text-[#8C9C92]">
            {t('accountDeletion.emailTitle', 'Option 2: By email')}
          </h3>
          <p>
            {t(
              'accountDeletion.emailInstructions',
              'If you can no longer access your account, send an email to',
            )}{' '}
            <a
              href="mailto:admin@nimoh-ict.nl?subject=Account%20Deletion%20Request"
              className="text-[#6B8F71] underline hover:text-[#8C9C92] transition-colors"
            >
              admin@nimoh-ict.nl
            </a>{' '}
            {t(
              'accountDeletion.emailDetails',
              'with the subject "Account Deletion Request" and the email address associated with your account. We will process your request within 30 days.',
            )}
          </p>
        </div>

        <h2 className="text-lg font-semibold text-white">
          {t('accountDeletion.whatDeletedTitle', 'What Gets Deleted')}
        </h2>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>{t('accountDeletion.deleted1', 'Your profile information (name, email, location)')}</li>
          <li>{t('accountDeletion.deleted2', 'All your book listings')}</li>
          <li>{t('accountDeletion.deleted3', 'Exchange history and messages')}</li>
          <li>{t('accountDeletion.deleted4', 'Ratings and reviews')}</li>
          <li>{t('accountDeletion.deleted5', 'Push notification tokens and preferences')}</li>
        </ul>

        <h2 className="text-lg font-semibold text-white">
          {t('accountDeletion.timelineTitle', 'Deletion Timeline')}
        </h2>
        <p>
          {t(
            'accountDeletion.timeline',
            'Once you request deletion, your account is immediately deactivated. All personal data is permanently and irreversibly removed within 30 days. During this grace period, you can cancel the deletion by logging in and tapping the cancellation banner.',
          )}
        </p>

        <h2 className="text-lg font-semibold text-white">
          {t('accountDeletion.contactTitle', 'Questions?')}
        </h2>
        <p>
          {t('accountDeletion.contact', 'For questions about data deletion, contact us at')}{' '}
          <a
            href="mailto:admin@nimoh-ict.nl"
            className="text-[#6B8F71] underline hover:text-[#8C9C92] transition-colors"
          >
            admin@nimoh-ict.nl
          </a>
          .{' '}
          {t('accountDeletion.seeAlso', 'See also our')}{' '}
          <LocaleLink
            to={PATHS.PRIVACY_POLICY}
            className="text-[#6B8F71] underline hover:text-[#8C9C92] transition-colors"
          >
            {t('accountDeletion.privacyLink', 'Privacy Policy')}
          </LocaleLink>
          .
        </p>
      </section>
    </main>
  );
}
