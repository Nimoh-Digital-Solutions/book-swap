import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { PATHS } from '@routes/config/paths';

export const Footer = ({ className }: { className?: string | undefined }): ReactElement => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={`border-t border-[#28382D] py-8 text-center text-[#5A6A60] text-sm font-medium ${className ?? ''}`}
    >
      <p>
        &copy; {currentYear} {t('app.name', 'BookSwap')} Amsterdam.{' '}
        {t('footer.tagline', 'Built for readers.')}
      </p>
      <nav className="mt-3 flex justify-center gap-4" aria-label={t('footer.legal', 'Legal')}>
        <Link to={PATHS.PRIVACY_POLICY} className="hover:text-[#8C9C92] transition-colors">
          {t('footer.privacy', 'Privacy Policy')}
        </Link>
        <Link to={PATHS.TERMS_OF_SERVICE} className="hover:text-[#8C9C92] transition-colors">
          {t('footer.terms', 'Terms of Service')}
        </Link>
      </nav>
    </footer>
  );
};
