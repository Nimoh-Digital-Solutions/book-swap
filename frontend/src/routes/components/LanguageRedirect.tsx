import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * LanguageRedirect — catch-all route that redirects paths without a language
 * prefix to `/{detectedLang}/{originalPath}`.
 *
 * Placed as a sibling (or fallback) of the `/:lng` route so that bare URLs
 * like `/login` or `/books/42` are transparently rewritten to `/en/login`
 * or `/en/books/42`.
 */
export function LanguageRedirect(): ReactElement {
  const { i18n } = useTranslation();
  const location = useLocation();

  const lang = i18n.language || 'en';
  const target = `/${lang}${location.pathname}${location.search}${location.hash}`;

  return <Navigate to={target} replace />;
}
