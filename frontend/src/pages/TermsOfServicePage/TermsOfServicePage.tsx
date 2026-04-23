import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useDocumentTitle } from '@hooks';
import { PATHS, routeMetadata } from '@routes/config/paths';

const SUPPORT_EMAIL = 'admin@nimoh-ict.nl';
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

export default function TermsOfServicePage(): ReactElement {
  const { t } = useTranslation('trust-safety');
  useDocumentTitle(routeMetadata[PATHS.TERMS_OF_SERVICE].title);

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-white">{t('terms.title')}</h1>
      <p className="text-sm text-[#8C9C92]">
        {t('terms.lastUpdated', { date: LAST_UPDATED })}
      </p>

      <p className="text-[#C5CEC8] text-sm leading-relaxed">
        These Terms of Service (&quot;Terms&quot;) govern your use of the
        BookSwap platform, developed and operated by{' '}
        <a
          href="https://nimoh-ict.nl"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#4ADE80] underline"
        >
          Nimoh Digital Solutions
        </a>{' '}
        (nimoh-ict.nl), registered in the Netherlands (&quot;we&quot;,
        &quot;us&quot;, &quot;our&quot;). By
        creating an account or using BookSwap, you agree to be bound by these
        Terms. If you do not agree, please do not use the platform.
      </p>

      <section className="space-y-4 text-[#C5CEC8] text-sm leading-relaxed">
        <Section number={1} title="Eligibility">
          <p>
            You must be at least 16 years old to create an account and use
            BookSwap. By registering, you represent that you meet this age
            requirement and that the information you provide is accurate and
            complete.
          </p>
        </Section>

        <Section number={2} title="Your Account">
          <p>
            You are responsible for maintaining the confidentiality of your
            account credentials and for all activity that occurs under your
            account. You agree to:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Provide accurate and up-to-date information during registration.</li>
            <li>Keep your password secure and not share it with others.</li>
            <li>Notify us immediately if you suspect unauthorised access to your account.</li>
            <li>Not create multiple accounts or transfer your account to another person.</li>
          </ul>
        </Section>

        <Section number={3} title="Permitted Use">
          <p>
            BookSwap is a community platform for exchanging physical books. You
            agree to use the platform only for its intended purpose. You may:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>List books you own and wish to swap.</li>
            <li>Browse and search for books available in your community.</li>
            <li>Request and arrange book exchanges with other users.</li>
            <li>Communicate with other users about exchanges via in-app messaging.</li>
            <li>Leave honest ratings and reviews after completing exchanges.</li>
          </ul>
        </Section>

        <Section number={4} title="Prohibited Conduct">
          <p>You agree not to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Post misleading, fraudulent, or inaccurate book listings.</li>
            <li>
              Harass, threaten, abuse, or discriminate against other users.
            </li>
            <li>
              Use the platform for commercial purposes, advertising, or selling
              books for money.
            </li>
            <li>
              List items that are not physical books (e.g. digital goods,
              non-book items).
            </li>
            <li>
              Create fake accounts, manipulate ratings, or engage in any form of
              platform abuse.
            </li>
            <li>
              Attempt to scrape, reverse-engineer, or interfere with the
              platform&apos;s infrastructure.
            </li>
            <li>
              Use the messaging system to send spam, unsolicited promotions, or
              content unrelated to book exchanges.
            </li>
            <li>Violate any applicable law or regulation.</li>
          </ul>
        </Section>

        <Section number={5} title="Book Listings">
          <p>
            When you list a book on BookSwap, you represent that:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>You own the book or have the right to exchange it.</li>
            <li>
              The condition description and photos accurately reflect the
              book&apos;s current state.
            </li>
            <li>
              The listing does not contain offensive, illegal, or misleading
              content.
            </li>
          </ul>
          <p>
            We reserve the right to remove listings that violate these
            requirements. Repeated misrepresentation of book condition may
            result in account restrictions or termination.
          </p>
        </Section>

        <Section number={6} title="Exchanges &amp; Meetups">
          <p>
            BookSwap facilitates connections between users but is{' '}
            <strong className="text-white">
              not a party to any exchange
            </strong>
            . You acknowledge that:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              You are solely responsible for arranging and completing exchanges
              safely.
            </li>
            <li>
              Meetups should take place in public, well-lit locations. We
              recommend meeting during daylight hours.
            </li>
            <li>
              BookSwap does not verify the identity of users beyond email
              verification and does not guarantee the condition of any book.
            </li>
            <li>
              You should inspect books at the time of exchange and raise any
              concerns immediately.
            </li>
          </ul>
        </Section>

        <Section number={7} title="Ratings &amp; Reviews">
          <p>
            After completing an exchange, both parties may leave a rating and
            review. Reviews must be honest, relevant to the exchange, and
            respectful. We reserve the right to remove reviews that contain:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Hate speech, personal attacks, or discriminatory language.</li>
            <li>Content unrelated to the exchange experience.</li>
            <li>Spam or promotional material.</li>
            <li>Deliberately false or misleading statements.</li>
          </ul>
        </Section>

        <Section number={8} title="Content &amp; Intellectual Property">
          <p>
            You retain ownership of content you upload to BookSwap (photos,
            descriptions, reviews). By posting content, you grant BookSwap a
            non-exclusive, royalty-free, worldwide licence to display and
            distribute that content within the platform for the purpose of
            operating the service. This licence ends when you delete the content
            or your account.
          </p>
          <p>
            The BookSwap name, logo, and platform design are the intellectual
            property of Nimoh Digital Solutions. You may not use them without prior written
            permission.
          </p>
        </Section>

        <Section number={9} title="Reporting &amp; Moderation">
          <p>
            We rely on our community to maintain a safe environment. You can
            report users or listings that violate these Terms using the in-app
            reporting feature. We review all reports and may take action
            including:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Issuing a warning to the user.</li>
            <li>Removing offending content or listings.</li>
            <li>Temporarily suspending the user&apos;s account.</li>
            <li>Permanently terminating the user&apos;s account.</li>
          </ul>
          <p>
            We aim to review all reports within 48 hours. Decisions regarding
            moderation are made at our discretion.
          </p>
        </Section>

        <Section number={10} title="Account Suspension &amp; Termination">
          <p>
            We reserve the right to suspend or terminate your account, without
            prior notice, if you violate these Terms or engage in conduct that
            we determine to be harmful to the platform or its users. Grounds for
            suspension or termination include, but are not limited to:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Repeated violations of the prohibited conduct rules.</li>
            <li>Fraudulent activity or identity misrepresentation.</li>
            <li>Receiving multiple verified reports from other users.</li>
            <li>Inactivity for more than 24 months (with prior email notice).</li>
          </ul>
          <p>
            You may delete your account at any time from the Settings page.
            Account deletion is processed in accordance with our{' '}
            <a href="/en/privacy-policy" className="text-[#4ADE80] underline">
              Privacy Policy
            </a>
            .
          </p>
        </Section>

        <Section number={11} title="Limitation of Liability">
          <p>
            To the maximum extent permitted by applicable law:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              BookSwap is provided on an &quot;as is&quot; and &quot;as
              available&quot; basis, without warranties of any kind, whether
              express or implied.
            </li>
            <li>
              We do not guarantee uninterrupted, error-free, or secure operation
              of the platform.
            </li>
            <li>
              We are not liable for any direct, indirect, incidental, or
              consequential damages arising from your use of the platform,
              including but not limited to loss of or damage to books during
              exchanges.
            </li>
            <li>
              We are not responsible for the actions, behaviour, or content of
              other users.
            </li>
          </ul>
          <p>
            Nothing in these Terms excludes or limits liability that cannot be
            excluded or limited under applicable law, including liability for
            fraud or wilful misconduct.
          </p>
        </Section>

        <Section number={12} title="Indemnification">
          <p>
            You agree to indemnify and hold harmless Nimoh Digital Solutions, its officers,
            and employees from any claims, damages, or expenses (including
            reasonable legal fees) arising from your use of the platform, your
            violation of these Terms, or your violation of any third-party
            rights.
          </p>
        </Section>

        <Section number={13} title="Privacy">
          <p>
            Your use of BookSwap is also governed by our{' '}
            <a href="/en/privacy-policy" className="text-[#4ADE80] underline">
              Privacy Policy
            </a>
            , which describes how we collect, use, and protect your personal
            data. By using BookSwap, you consent to the data practices described
            in that policy.
          </p>
        </Section>

        <Section number={14} title="Changes to These Terms">
          <p>
            We may update these Terms from time to time. When we make
            significant changes, we will notify you via email or an in-app
            notification at least 14 days before the changes take effect. The
            &quot;last updated&quot; date at the top of this page reflects the
            most recent revision. Continued use of BookSwap after the updated
            Terms take effect constitutes your acceptance of the changes.
          </p>
        </Section>

        <Section number={15} title="Governing Law &amp; Disputes">
          <p>
            These Terms are governed by the laws of the Netherlands. Any
            disputes arising from or relating to these Terms or your use of
            BookSwap shall be submitted to the competent courts in Amsterdam,
            the Netherlands. This does not affect any mandatory consumer
            protection rights you may have under the laws of your country of
            residence.
          </p>
        </Section>

        <Section number={16} title="Severability">
          <p>
            If any provision of these Terms is found to be unenforceable or
            invalid, that provision shall be limited or eliminated to the
            minimum extent necessary, and the remaining provisions shall remain
            in full force and effect.
          </p>
        </Section>

        <Section number={17} title="Contact">
          <p>
            If you have questions about these Terms, contact us at:
          </p>
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
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-[#4ADE80] underline"
              >
                {SUPPORT_EMAIL}
              </a>
            </p>
          </address>
        </Section>
      </section>
    </main>
  );
}
