import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useAuthStore } from '@features/auth/stores/authStore';
import { PATHS } from '@routes/config/paths';

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
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#E4B643] rounded-sm transform rotate-45 flex items-center justify-center">
              <div className="w-4 h-4 bg-[#152018] transform -rotate-45 rounded-sm" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">BookSwap</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link to={PATHS.CATALOGUE} className="text-white hover:text-[#E4B643] transition-colors">{t('home.nav.browse', 'Browse')}</Link>
            {isAuthenticated && (
              <Link to={PATHS.MY_SHELF} className="text-white hover:text-[#E4B643] transition-colors">{t('navigation.myShelf', 'My Shelf')}</Link>
            )}
            {isAuthenticated && (
              <Link to={PATHS.EXCHANGES} className="text-white hover:text-[#E4B643] transition-colors">{t('navigation.exchanges', 'Exchanges')}</Link>
            )}
            <a href={PATHS.HOW_IT_WORKS} className="hover:text-white transition-colors">{t('home.nav.howItWorks', 'How it Works')}</a>
            <a href={PATHS.COMMUNITY} className="hover:text-white transition-colors">{t('home.nav.community', 'Community')}</a>
          </div>
        </div>
         {isAuthenticated ? (
          <Link to={PATHS.PROFILE} className="bg-[#E4B643] hover:bg-[#D4A633] text-[#152018] px-5 py-2 rounded-full font-bold text-sm transition-colors">
            {t('navigation.profile', 'My Profile')}
          </Link>
        ) : (
        <Link to={PATHS.LOGIN} className="bg-[#E4B643] hover:bg-[#D4A633] text-[#152018] px-6 py-2 rounded-full font-bold text-sm transition-colors">
          {t('home.nav.signIn', 'Sign In')} 
        </Link>
        )}
      </nav>
    </header>
  );
};
