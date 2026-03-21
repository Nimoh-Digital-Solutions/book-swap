import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

export const Footer = ({ className }: { className?: string }): ReactElement => {
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
    </footer>
  );
};
