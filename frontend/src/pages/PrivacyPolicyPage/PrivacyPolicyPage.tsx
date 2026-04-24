import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { SEOHead } from '@components';
import { PATHS, routeMetadata } from '@routes/config/paths';

const PRIVACY_EMAIL = 'admin@nimoh-ict.nl';
const LAST_UPDATED = '2026-04-23';

function Section({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <h2 className="text-lg font-semibold text-white mt-2">
        {number}. {title}
      </h2>
      {children}
    </>
  );
}

export default function PrivacyPolicyPage(): ReactElement {
  const { t } = useTranslation('trust-safety');

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <SEOHead
        title={routeMetadata[PATHS.PRIVACY_POLICY].title}
        description={routeMetadata[PATHS.PRIVACY_POLICY].description}
        path={PATHS.PRIVACY_POLICY}
      />
      <h1 className="text-2xl font-bold text-white">{t('privacy.title')}</h1>
      <p className="text-sm text-[#8C9C92]">
        {t('privacy.lastUpdated', { date: LAST_UPDATED })}
      </p>

      <p className="text-[#C5CEC8] text-sm leading-relaxed">
        BookSwap (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is developed
        and operated by{' '}
        <a
          href="https://nimoh-ict.nl"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#4ADE80] underline"
        >
          Nimoh Digital Solutions
        </a>{' '}
        (nimoh-ict.nl), registered in the Netherlands. This Privacy Policy explains
        what personal data we collect, why we collect it, how we process it, and
        what rights you have. We are committed to protecting your privacy and
        processing your data in accordance with the General Data Protection
        Regulation (GDPR) and other applicable data protection laws.
      </p>

      <section className="space-y-4 text-[#C5CEC8] text-sm leading-relaxed">
        <Section number={1} title="Data Controller">
          <p>
            Nimoh Digital Solutions is the data controller responsible for your personal
            data. If you have questions or wish to exercise your rights, contact
            us at{' '}
            <a
              href={`mailto:${PRIVACY_EMAIL}`}
              className="text-[#4ADE80] underline"
            >
              {PRIVACY_EMAIL}
            </a>
            .
          </p>
        </Section>

        <Section number={2} title="Data We Collect">
          <p>We collect only data necessary to operate BookSwap:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              <strong className="text-white">Account information</strong> —
              name, email address, and password (hashed, never stored in
              plaintext).
            </li>
            <li>
              <strong className="text-white">Profile information</strong> —
              optional biography, preferred genres, and profile photo.
            </li>
            <li>
              <strong className="text-white">Location data</strong> —
              approximate location (city, neighbourhood, or postal code) to show
              nearby book listings. We never collect or store precise GPS
              coordinates.
            </li>
            <li>
              <strong className="text-white">Book listings</strong> — titles,
              authors, ISBNs, condition descriptions, and photos of books you
              list.
            </li>
            <li>
              <strong className="text-white">Exchange activity</strong> — swap
              requests, exchange history, and meetup arrangements.
            </li>
            <li>
              <strong className="text-white">Messages</strong> — content of
              messages exchanged between users on the platform.
            </li>
            <li>
              <strong className="text-white">Ratings &amp; reviews</strong> —
              ratings and written feedback you give or receive.
            </li>
            <li>
              <strong className="text-white">Device &amp; usage data</strong> —
              device type, operating system, app version, and anonymous usage
              analytics (if not opted out). We do not use fingerprinting or
              cross-app tracking.
            </li>
            <li>
              <strong className="text-white">Push notification tokens</strong> —
              if you enable push notifications on the mobile app.
            </li>
          </ul>
        </Section>

        <Section number={3} title="Legal Basis for Processing">
          <p>We process your data based on the following legal grounds:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              <strong className="text-white">Contract performance</strong> —
              processing necessary to provide the BookSwap service (account
              management, book listings, exchanges, messaging).
            </li>
            <li>
              <strong className="text-white">Legitimate interest</strong> —
              fraud prevention, platform security, and service improvement, where
              our interests do not override your rights.
            </li>
            <li>
              <strong className="text-white">Consent</strong> — push
              notifications and optional analytics. You can withdraw consent at
              any time in your Settings.
            </li>
            <li>
              <strong className="text-white">Legal obligation</strong> — where
              required to comply with applicable laws (e.g. responding to lawful
              requests from authorities).
            </li>
          </ul>
        </Section>

        <Section number={4} title="How We Use Your Data">
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Facilitate book swaps and exchanges in your community.</li>
            <li>Show relevant book listings based on your location and preferences.</li>
            <li>Enable messaging and meetup coordination between users.</li>
            <li>Send transactional notifications (swap requests, status updates, messages).</li>
            <li>Maintain trust and safety through ratings, reviews, and content moderation.</li>
            <li>Detect and prevent fraud, abuse, and policy violations.</li>
            <li>Improve the platform through aggregated, anonymised usage analytics.</li>
          </ul>
          <p>
            We <strong className="text-white">never</strong> sell, rent, or
            trade your personal data to third parties for marketing purposes.
          </p>
        </Section>

        <Section number={5} title="Data Sharing &amp; Third Parties">
          <p>We share your data only when necessary:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              <strong className="text-white">Other BookSwap users</strong> —
              your public profile, book listings, ratings, and messages to
              exchange partners are visible to other users as part of the
              service.
            </li>
            <li>
              <strong className="text-white">Infrastructure providers</strong> —
              hosting (EU-based), email delivery (SendGrid), error tracking
              (Sentry), and push notification services (Expo/APNs/FCM). These
              providers process data on our behalf under data processing
              agreements.
            </li>
            <li>
              <strong className="text-white">Legal requirements</strong> — we
              may disclose data if required by law, court order, or to protect
              the safety of our users.
            </li>
          </ul>
          <p>
            We do not use any advertising networks, social media tracking
            pixels, or third-party analytics services that profile individual
            users.
          </p>
        </Section>

        <Section number={6} title="Data Storage &amp; Security">
          <p>
            Your data is stored on servers located in the European Union. We
            implement appropriate technical and organisational measures to
            protect your data, including:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Encryption in transit using TLS 1.2+.</li>
            <li>Encryption at rest for sensitive data (passwords, tokens).</li>
            <li>Access controls and the principle of least privilege for all systems.</li>
            <li>Regular security audits and dependency updates.</li>
            <li>Passwords hashed with industry-standard algorithms (never stored in plaintext).</li>
          </ul>
        </Section>

        <Section number={7} title="Data Retention">
          <p>We retain your data only as long as necessary:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              <strong className="text-white">Active accounts</strong> — data is
              retained for the lifetime of your account.
            </li>
            <li>
              <strong className="text-white">Deleted accounts</strong> — upon
              deletion, your account is immediately deactivated. All personal
              data is permanently and irreversibly removed within 30 days.
            </li>
            <li>
              <strong className="text-white">Messages</strong> — messages to
              other users may be retained in anonymised form after account
              deletion to preserve conversation integrity for the other party.
            </li>
            <li>
              <strong className="text-white">Legal holds</strong> — data may be
              retained longer if required by law or to resolve disputes.
            </li>
          </ul>
        </Section>

        <Section number={8} title="Your Rights (GDPR)">
          <p>Under the GDPR, you have the following rights:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              <strong className="text-white">Access</strong> — request a copy of
              all personal data we hold about you.
            </li>
            <li>
              <strong className="text-white">Rectification</strong> — correct
              inaccurate or incomplete data via your profile or by contacting us.
            </li>
            <li>
              <strong className="text-white">Erasure</strong> — request deletion
              of your account and all associated data.
            </li>
            <li>
              <strong className="text-white">Restriction</strong> — request
              restricted processing while we resolve a dispute or verify data
              accuracy.
            </li>
            <li>
              <strong className="text-white">Data portability</strong> —
              download a machine-readable copy of your data from the Settings
              page.
            </li>
            <li>
              <strong className="text-white">Objection</strong> — object to
              processing based on legitimate interest.
            </li>
            <li>
              <strong className="text-white">Withdraw consent</strong> —
              withdraw consent for optional processing (e.g. push notifications,
              analytics) at any time.
            </li>
          </ul>
          <p>
            To exercise any of these rights, use the built-in tools in your
            Settings page (data export, account deletion) or contact us at{' '}
            <a
              href={`mailto:${PRIVACY_EMAIL}`}
              className="text-[#4ADE80] underline"
            >
              {PRIVACY_EMAIL}
            </a>
            . We will respond within 30 days.
          </p>
        </Section>

        <Section number={9} title="Cookies &amp; Local Storage">
          <p>
            BookSwap uses <strong className="text-white">essential cookies only</strong>:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              <strong className="text-white">Session cookie</strong> — maintains
              your authenticated session (httpOnly, secure).
            </li>
            <li>
              <strong className="text-white">CSRF token</strong> — protects
              against cross-site request forgery attacks.
            </li>
            <li>
              <strong className="text-white">Cookie consent preference</strong>{' '}
              — remembers that you acknowledged this notice.
            </li>
          </ul>
          <p>
            We do not use tracking cookies, advertising cookies, or third-party
            analytics cookies. The mobile app uses secure on-device storage for
            authentication tokens and does not use cookies.
          </p>
        </Section>

        <Section number={10} title="Children&apos;s Privacy">
          <p>
            BookSwap is not intended for children under the age of 16. We do not
            knowingly collect personal data from children. If you believe a child
            has provided us with personal data, please contact us and we will
            promptly delete it.
          </p>
        </Section>

        <Section number={11} title="International Transfers">
          <p>
            Your data is stored and processed within the European Economic Area
            (EEA). If any data processing requires transfer outside the EEA
            (e.g. push notification delivery via Apple/Google), we ensure
            appropriate safeguards are in place, such as Standard Contractual
            Clauses or adequacy decisions by the European Commission.
          </p>
        </Section>

        <Section number={12} title="Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. When we make
            significant changes, we will notify you via email or an in-app
            notification. The &quot;last updated&quot; date at the top of this
            page reflects the most recent revision. Continued use of BookSwap
            after changes take effect constitutes acceptance of the updated
            policy.
          </p>
        </Section>

        <Section number={13} title="Complaints">
          <p>
            If you believe your data protection rights have been violated, you
            have the right to lodge a complaint with a supervisory authority. In
            the Netherlands, this is the Autoriteit Persoonsgegevens (
            <a
              href="https://autoriteitpersoonsgegevens.nl"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#4ADE80] underline"
            >
              autoriteitpersoonsgegevens.nl
            </a>
            ). You can also contact us first and we will do our best to resolve
            your concern.
          </p>
        </Section>

        <Section number={14} title="Contact">
          <p>For any privacy-related questions or requests, contact us at:</p>
          <address className="not-italic ml-2 space-y-1">
            <p>
              <a
                href="https://nimoh-ict.nl"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#4ADE80] underline"
              >
                Nimoh Digital Solutions
              </a>
            </p>
            <p>
              Email:{' '}
              <a
                href={`mailto:${PRIVACY_EMAIL}`}
                className="text-[#4ADE80] underline"
              >
                {PRIVACY_EMAIL}
              </a>
            </p>
          </address>
        </Section>
      </section>
    </main>
  );
}
