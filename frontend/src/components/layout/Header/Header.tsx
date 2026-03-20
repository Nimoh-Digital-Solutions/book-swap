import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { LuHouse, LuLayers, LuMoon, LuSun, LuSunMedium } from 'react-icons/lu';
import { NavLink } from 'react-router-dom';

import { APP_CONFIG } from '@configs';
import { useThemeContext } from '@contexts';
import { PATHS } from '@routes/config/paths';

import styles from './Header.module.scss';

/**
 * Header
 * Layout component — includes light → dim → dark theme cycler.
 */
export const Header = ({ className }: { className?: string }): ReactElement => {
  const { t } = useTranslation();
  const { theme, toggleTheme, preferredTheme, setPreferredTheme } = useThemeContext();

  const navLinks = [
    { name: t('navigation.home'),       path: PATHS.HOME,            icon: <LuHouse  aria-hidden="true" size={22} /> },
    { name: t('navigation.components'), path: PATHS.COMPONENTS_DEMO, icon: <LuLayers aria-hidden="true" size={22} /> },
  ];

  const themeConfig = {
    light: { icon: <LuMoon  size={20} aria-hidden="true" />, label: t('theme.switchToDim')  },
    dim:   { icon: <LuSun   size={20} aria-hidden="true" />, label: t('theme.switchToDark') },
    dark:  { icon: <LuSunMedium size={20} aria-hidden="true" />, label: t('theme.switchToLight') },
  } as const;

  const { icon, label } = themeConfig[theme] ?? themeConfig.light;
  const isPreferred = theme === preferredTheme;

  return (
    <header className={className ? `${styles.root} ${className}` : styles.root}>
      <nav className={styles.nav} aria-label={t('navigation.mainLabel')}>
        <NavLink to="/" className={styles.navBrand!}>
          {APP_CONFIG.appName}
        </NavLink>
        <ul className={styles.navLinks}>
          {navLinks.map(({ name, path, icon: navIcon }) => (
            <li key={path}>
              <NavLink
                to={path}
                className={({ isActive }) =>
                  isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
                }
              >
                {navIcon} {name}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className={styles.themeActions}>
          <button
            className={styles.themeToggle}
            onClick={toggleTheme}
            aria-label={label}
            title={label}
            data-theme-current={theme}
          >
            {icon}
            <span className={styles.themeLabel}>{theme}</span>
          </button>
          <button
            className={`${styles.themeDefault}${isPreferred ? ` ${styles.themeDefaultActive}` : ''}`}
            onClick={() => setPreferredTheme(isPreferred ? null : theme)}
            aria-label={isPreferred ? t('theme.unpinDefault') : t('theme.setDefault')}
            title={isPreferred ? t('theme.unpinDefault') : t('theme.setDefault')}
          >
            <span aria-hidden="true">{isPreferred ? '★' : '☆'}</span>
          </button>
        </div>
      </nav>
    </header>
  );
};
