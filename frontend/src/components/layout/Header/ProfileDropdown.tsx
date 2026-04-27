import { type ReactElement, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LocaleLink } from '@components/common/LocaleLink/LocaleLink';
import { useAuthStore } from '@features/auth/stores/authStore';
import { useProfile } from '@features/profile/hooks/useProfile';
import { useLocaleNavigate } from '@hooks/useLocaleNavigate';
import { PATHS } from '@routes/config/paths';
import { ArrowLeftRight,BookMarked, LogOut, Settings, User } from 'lucide-react';

function getInitials(firstName: string, lastName: string, email: string): string {
  const first = firstName.trim();
  const last = lastName.trim();
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (first) return (first[0] ?? '').toUpperCase();
  return (email[0] ?? '?').toUpperCase();
}

export function ProfileDropdown(): ReactElement {
  const { t } = useTranslation();
  const navigate = useLocaleNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const { data: profile } = useProfile();

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;

    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    void navigate(PATHS.HOME);
  };

  // Use profile data (from GET /users/me/) for display — nimoh-base redacts
  // the email stored in the auth store's AuthUser, but the full profile
  // endpoint returns the real value.
  const email = profile?.email ?? user?.email ?? '';
  const firstName = profile?.first_name ?? user?.first_name ?? '';
  const lastName = profile?.last_name ?? user?.last_name ?? '';

  const initials = getInitials(firstName, lastName, email);
  const avatar = profile?.avatar ?? null;
  const displayName = [firstName, lastName].filter(Boolean).join(' ') || email;

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={t('navigation.profileMenu', 'Profile menu')}
        className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E4B643]"
      >
        {avatar ? (
          <img
            src={avatar}
            alt={displayName}
            className="w-9 h-9 rounded-full object-cover border-2 border-[#28382D]"
          />
        ) : (
          <div
            aria-hidden="true"
            className="w-9 h-9 rounded-full bg-[#E4B643] text-[#152018] flex items-center justify-center font-bold text-sm select-none"
          >
            {initials}
          </div>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          role="menu"
          aria-label={t('navigation.profileMenu', 'Profile menu')}
          className="absolute right-0 mt-2 w-48 bg-[#1A251D] border border-[#28382D] rounded-xl shadow-xl pt-1 z-50"
        >
          {/* User info header */}
          <div className="px-4 py-4 border-b border-[#28382D]">
            <p className="text-sm font-semibold text-white truncate">{displayName}</p>
            {email && (
              <p className="text-xs text-[#8C9C92]/60 truncate">{email}</p>
            )}
          </div>

          <LocaleLink
            to={PATHS.PROFILE}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-[#28382D] transition-colors"
          >
            <User className="w-4 h-4 text-[#8C9C92]" aria-hidden="true" />
            {t('navigation.myProfile', 'Profile')}
          </LocaleLink>

          <LocaleLink
            to={PATHS.MY_SHELF}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-[#28382D] transition-colors"
          >
            <BookMarked className="w-4 h-4 text-[#8C9C92]" aria-hidden="true" />
            {t('navigation.myShelf', 'My Shelf')}
          </LocaleLink>

          <LocaleLink
            to={PATHS.EXCHANGES}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-[#28382D] transition-colors"
          >
            <ArrowLeftRight className="w-4 h-4 text-[#8C9C92]" aria-hidden="true" />
            {t('navigation.exchanges', 'Exchanges')}
          </LocaleLink>

          <LocaleLink
            to={PATHS.SETTINGS}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-[#28382D] transition-colors"
          >
            <Settings className="w-4 h-4 text-[#8C9C92]" aria-hidden="true" />
            {t('navigation.settings', 'Settings')}
          </LocaleLink>

          <div className="border-t border-[#28382D]">
            <button
              type="button"
              role="menuitem"
              onClick={() => { void handleLogout(); }}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors rounded-bl-xl rounded-br-xl"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              {t('navigation.signOut', 'Sign Out')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
