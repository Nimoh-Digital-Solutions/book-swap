import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { logoMark } from '@assets';
import { LocaleLink } from '@components/common/LocaleLink/LocaleLink';
import { useAuthStore } from '@features/auth/stores/authStore';
import { NotificationBell } from '@features/notifications';
import { PATHS } from '@routes/config/paths';

import { ProfileDropdown } from './ProfileDropdown';

export const Header = ({ className }: { className?: string }): ReactElement => {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <header
      className={`sticky top-0 z-40 bg-[#152018] backdrop-blur-[16px] ${className ?? ''}`}
    >
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto border-b border-[#28382D]/50" aria-label="Main navigation" style={{ marginInline: 'auto' }}>
        <div className="flex items-center gap-8">
          <LocaleLink to={PATHS.HOME} className="flex items-center gap-3">
            <img src={logoMark} alt="" width={32} height={32} />
            <span className="text-xl font-bold tracking-tight text-white">BookSwap</span>
          </LocaleLink>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <LocaleLink to={PATHS.CATALOGUE} className="text-white hover:text-[#E4B643] transition-colors">{t('home.nav.browse', 'Browse')}</LocaleLink>
            <LocaleLink to={PATHS.HOW_IT_WORKS} className="hover:text-white transition-colors">{t('home.nav.howItWorks', 'How it Works')}</LocaleLink>
            <LocaleLink to={PATHS.COMMUNITY} className="hover:text-white transition-colors">{t('home.nav.community', 'Community')}</LocaleLink>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isAuthenticated && <NotificationBell enabled={isAuthenticated} />}
          {isAuthenticated ? (
          <ProfileDropdown />
        ) : (
        <LocaleLink to={PATHS.LOGIN} className="bg-[#E4B643] hover:bg-[#D4A633] text-[#152018] px-6 py-2 rounded-full font-bold text-sm transition-colors">
          {t('home.nav.signIn', 'Sign In')} 
        </LocaleLink>
        )}
        </div>
      </nav>
    </header>
  );
};
