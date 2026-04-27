import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { LocaleLink } from '@components/common/LocaleLink/LocaleLink';
import { PATHS } from '@routes/config/paths';

export const Footer = ({ className }: { className?: string | undefined }): ReactElement => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer
      // RESP-022 (Sprint C): tighter typography (`text-xs sm:text-sm`)
      // and gaps (`gap-x-3 gap-y-1`) so iPhone SE (320 px) shows the
      // copyright + 3 legal links in 2 lines instead of 5–6.
      className={`border-t border-[#28382D] py-6 px-4 text-[#5A6A60] text-xs sm:text-sm font-medium ${className ?? ''}`}
    >
      <div className="flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-4 gap-y-1 sm:gap-y-2">
        <p className="whitespace-nowrap">
          &copy; {currentYear} {t('app.name', 'BookSwap')}.{' '}
          {t('footer.tagline', 'Built for readers.')}{' '}
          {/* The "by Nimoh Digital Solutions" attribution is hidden below
            * `sm:` to save a line on phones — the legal pages still credit
            * the company. */}
          <span className="hidden sm:inline text-[#485A4E]">
            by{' '}
            <a
              href="https://nimoh-ict.nl"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#8C9C92] transition-colors underline"
            >
              Nimoh Digital Solutions
            </a>
          </span>
        </p>
        <span className="hidden sm:inline text-[#28382D]" aria-hidden="true">|</span>
        <nav className="flex items-center gap-3 sm:gap-4" aria-label={t('footer.legal', 'Legal')}>
          <LocaleLink to={PATHS.PRIVACY_POLICY} className="hover:text-[#8C9C92] transition-colors">
            {t('footer.privacy', 'Privacy Policy')}
          </LocaleLink>
          <LocaleLink to={PATHS.TERMS_OF_SERVICE} className="hover:text-[#8C9C92] transition-colors">
            {t('footer.terms', 'Terms of Service')}
          </LocaleLink>
          <LocaleLink to={PATHS.ACCOUNT_DELETION} className="hover:text-[#8C9C92] transition-colors">
            {t('footer.accountDeletion', 'Delete Account')}
          </LocaleLink>
        </nav>
      </div>
    </footer>
  );
};
