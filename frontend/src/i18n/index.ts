/**
 * i18n initialisation
 *
 * Uses `i18next-http-backend` to lazy-load translations from
 * `/locales/{{lng}}/{{ns}}.json` at runtime (they are not bundled).
 *
 * Uses `i18next-browser-languagedetector` to auto-detect the user's
 * language preference in this order:
 *   querystring → localStorage → navigator → htmlTag
 *
 * The i18n instance is exported so it can be passed directly to
 * `<I18nextProvider i18n={i18n}>` in `App.tsx`.
 *
 * Removing i18n:
 *   Run `yarn setup` and deselect "Internationalisation (i18n)".  The setup
 *   script will delete this directory, revert `App.tsx`, and remove the
 *   `i18next` / `react-i18next` packages from `package.json`.
 */
import { initReactI18next } from 'react-i18next';

import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

export const SUPPORTED_LANGUAGES = ['en', 'fr', 'nl'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

void i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // --- Backend: load translations from public/locales/ at runtime --------
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    // --- Language detection -------------------------------------------------
    detection: {
      order: ['querystring', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupQuerystring: 'lng',
      lookupLocalStorage: 'i18nextLng',
    },

    // --- Defaults -----------------------------------------------------------
    supportedLngs: [...SUPPORTED_LANGUAGES],
    fallbackLng: 'en',
    ns: ['translation', 'exchanges', 'messaging', 'ratings', 'trust-safety'],
    defaultNS: 'translation',

    interpolation: {
      // React already escapes values — no need for i18next to double-escape.
      escapeValue: false,
    },
  });

export default i18n;
