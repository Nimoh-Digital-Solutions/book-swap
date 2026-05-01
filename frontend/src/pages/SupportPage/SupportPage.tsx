import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { SEOHead } from '@components';
import { LocaleLink } from '@components/common/LocaleLink/LocaleLink';
import { PATHS, routeMetadata } from '@routes/config/paths';

const SUPPORT_EMAIL = 'admin@nimoh-ict.nl';
const LAST_UPDATED = '2026-05-01';

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-semibold text-white mt-2">{children}</h2>
  );
}

export default function SupportPage(): ReactElement {
  const { t } = useTranslation('trust-safety');

  const subjectContact = encodeURIComponent('BookSwap support');
  const subjectBug = encodeURIComponent('BookSwap bug report');
  const subjectAccount = encodeURIComponent('BookSwap account help');

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <SEOHead
        title={routeMetadata[PATHS.SUPPORT].title}
        description={routeMetadata[PATHS.SUPPORT].description}
        path={PATHS.SUPPORT}
      />
      <h1 className="text-2xl font-bold text-white">
        {t('support.title', 'Support')}
      </h1>
      <p className="text-sm text-[#8C9C92]">
        {t('support.lastUpdated', 'Last updated: {{date}}', { date: LAST_UPDATED })}
      </p>

      <p className="text-[#C5CEC8] text-sm leading-relaxed">
        {t(
          'support.intro',
          'BookSwap is a free book-exchange community. If something is not working, you have a question, or you need help with your account, this page is the fastest way to get unstuck. Most issues are answered below; for anything else, email us and we will reply within 48 hours.',
        )}
      </p>

      <section className="space-y-4 text-[#C5CEC8] text-sm leading-relaxed">
        <SectionHeading>{t('support.contact.title', 'Contact us')}</SectionHeading>
        <div className="grid sm:grid-cols-3 gap-3">
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${subjectContact}`}
            className="rounded-lg border border-[#28382D] p-3 hover:border-[#4ADE80] transition-colors"
          >
            <p className="text-white font-semibold">
              {t('support.contact.generalTitle', 'General question')}
            </p>
            <p className="text-xs text-[#8C9C92] mt-1">
              {t('support.contact.generalBody', 'About swaps, listings, or how the app works.')}
            </p>
          </a>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${subjectBug}`}
            className="rounded-lg border border-[#28382D] p-3 hover:border-[#4ADE80] transition-colors"
          >
            <p className="text-white font-semibold">
              {t('support.contact.bugTitle', 'Report a bug')}
            </p>
            <p className="text-xs text-[#8C9C92] mt-1">
              {t('support.contact.bugBody', 'Something crashed, broke, or behaves strangely.')}
            </p>
          </a>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${subjectAccount}`}
            className="rounded-lg border border-[#28382D] p-3 hover:border-[#4ADE80] transition-colors"
          >
            <p className="text-white font-semibold">
              {t('support.contact.accountTitle', 'Account help')}
            </p>
            <p className="text-xs text-[#8C9C92] mt-1">
              {t('support.contact.accountBody', 'Sign-in, password reset, email change, or deletion.')}
            </p>
          </a>
        </div>
        <p>
          {t('support.contact.directIntro', 'You can also email us directly at')}{' '}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="text-[#4ADE80] underline"
          >
            {SUPPORT_EMAIL}
          </a>
          .{' '}
          {t('support.contact.responseTime', 'We aim to reply within 48 hours, Monday to Friday.')}
        </p>

        <SectionHeading>{t('support.faq.title', 'Frequently asked questions')}</SectionHeading>

        <div className="space-y-3">
          <div>
            <p className="text-white font-semibold">
              {t('support.faq.cost.q', 'Is BookSwap free?')}
            </p>
            <p>
              {t(
                'support.faq.cost.a',
                'Yes — BookSwap is completely free. There are no fees, no subscriptions, no in-app purchases, and no ads. We earn nothing from the swaps themselves.',
              )}
            </p>
          </div>

          <div>
            <p className="text-white font-semibold">
              {t('support.faq.howItWorks.q', 'How does swapping work?')}
            </p>
            <p>
              {t(
                'support.faq.howItWorks.a',
                'List a book you want to share, browse books available near you, request a swap, and chat with the other reader to arrange a meetup. No money changes hands. The full walkthrough is in our',
              )}{' '}
              <LocaleLink to={PATHS.HOW_IT_WORKS} className="text-[#4ADE80] underline">
                {t('support.faq.howItWorks.link', 'How It Works')}
              </LocaleLink>{' '}
              {t('support.faq.howItWorks.suffix', 'guide.')}
            </p>
          </div>

          <div>
            <p className="text-white font-semibold">
              {t('support.faq.location.q', 'Why am I not seeing any books near me?')}
            </p>
            <p>
              {t(
                'support.faq.location.a',
                'BookSwap shows books within a configurable radius of your set location. If the map looks empty, your area may simply be quiet at launch — try a wider radius from the map filters, or list a book yourself to seed your neighbourhood. Make sure you completed the location step during onboarding.',
              )}
            </p>
          </div>

          <div>
            <p className="text-white font-semibold">
              {t('support.faq.push.q', 'I am not getting push notifications.')}
            </p>
            <p>
              {t(
                'support.faq.push.a',
                'On iOS and Android, check that notifications are allowed for BookSwap in your device Settings. Inside the app, go to Settings → Notifications and confirm the categories you want are enabled. If you signed in on a new phone, push tokens are refreshed automatically; if delivery is still inconsistent, contact support and we can verify the registration on our side.',
              )}
            </p>
          </div>

          <div>
            <p className="text-white font-semibold">
              {t('support.faq.signin.q', 'I cannot sign in.')}
            </p>
            <p>
              {t(
                'support.faq.signin.a',
                'Use the “Forgot password?” link on the sign-in screen to reset your password by email. If you signed up with Google or Apple, use the same provider button to sign back in. If you no longer have access to the email on the account, write to us and we can help recover it.',
              )}
            </p>
          </div>

          <div>
            <p className="text-white font-semibold">
              {t('support.faq.devices.q', 'Which devices are supported?')}
            </p>
            <p>
              {t(
                'support.faq.devices.a',
                'BookSwap is available on iPhone (iOS 16 and later), Android (8.0 and later), and on the web in any modern browser. The mobile and web apps share the same account.',
              )}
            </p>
          </div>

          <div>
            <p className="text-white font-semibold">
              {t('support.faq.delete.q', 'How do I delete my account?')}
            </p>
            <p>
              {t(
                'support.faq.delete.a',
                'Go to Settings in the app and tap “Delete account”, or follow the instructions on our',
              )}{' '}
              <LocaleLink to={PATHS.ACCOUNT_DELETION} className="text-[#4ADE80] underline">
                {t('support.faq.delete.link', 'Account & Data Deletion')}
              </LocaleLink>{' '}
              {t('support.faq.delete.suffix', 'page.')}
            </p>
          </div>
        </div>

        <SectionHeading>{t('support.report.title', 'Reporting users or content')}</SectionHeading>
        <p>
          {t(
            'support.report.body',
            'If a user behaves abusively, lists a fake book, or violates our community guidelines, tap the Report button on their profile or on the listing. Our trust & safety team reviews reports within 48 hours. For urgent safety concerns, also email us so we can act quickly.',
          )}
        </p>

        <SectionHeading>{t('support.links.title', 'Helpful links')}</SectionHeading>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>
            <LocaleLink to={PATHS.HOW_IT_WORKS} className="text-[#4ADE80] underline">
              {t('support.links.howItWorks', 'How BookSwap works')}
            </LocaleLink>
          </li>
          <li>
            <LocaleLink to={PATHS.PRIVACY_POLICY} className="text-[#4ADE80] underline">
              {t('support.links.privacy', 'Privacy policy')}
            </LocaleLink>
          </li>
          <li>
            <LocaleLink to={PATHS.TERMS_OF_SERVICE} className="text-[#4ADE80] underline">
              {t('support.links.terms', 'Terms of service')}
            </LocaleLink>
          </li>
          <li>
            <LocaleLink to={PATHS.ACCOUNT_DELETION} className="text-[#4ADE80] underline">
              {t('support.links.accountDeletion', 'Delete your account')}
            </LocaleLink>
          </li>
        </ul>

        <SectionHeading>{t('support.operator.title', 'Operator')}</SectionHeading>
        <p>
          {t('support.operator.body', 'BookSwap is built and operated by')}{' '}
          <a
            href="https://nimoh-ict.nl"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#4ADE80] underline"
          >
            Nimoh Digital Solutions
          </a>
          {t('support.operator.suffix', ', registered in the Netherlands. For privacy or data-protection requests, see the contact section of our')}{' '}
          <LocaleLink to={PATHS.PRIVACY_POLICY} className="text-[#4ADE80] underline">
            {t('support.operator.privacyLink', 'Privacy Policy')}
          </LocaleLink>
          .
        </p>
      </section>
    </main>
  );
}
