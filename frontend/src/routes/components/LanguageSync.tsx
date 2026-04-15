import { type ReactElement, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';

import { isSupportedLanguage } from '../utils/localePath';

/**
 * LanguageSync — layout route placed at `/:lng`.
 *
 * Responsibilities:
 * 1. Validate the `:lng` param against SUPPORTED_LANGUAGES.
 * 2. Sync the URL language → i18next (and the `<html lang>` attribute).
 * 3. If the language code is invalid, redirect to the same path under the
 *    user's detected language.
 */
export function LanguageSync(): ReactElement {
  const { lng } = useParams<{ lng: string }>();
  const { i18n } = useTranslation();
  const location = useLocation();

  const isValid = isSupportedLanguage(lng);

  useEffect(() => {
    if (isValid && lng !== i18n.language) {
      void i18n.changeLanguage(lng);
    }
  }, [lng, i18n, isValid]);

  useEffect(() => {
    if (isValid) {
      document.documentElement.lang = lng!;
    }
  }, [lng, isValid]);

  if (!isValid) {
    const fallback = i18n.language || 'en';
    const rest = location.pathname.replace(new RegExp(`^/${lng}`), '');
    return (
      <Navigate
        to={`/${fallback}${rest || '/'}${location.search}${location.hash}`}
        replace
      />
    );
  }

  return <Outlet />;
}
