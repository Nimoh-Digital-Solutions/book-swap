/**
 * i18n test configuration
 *
 * Re-initialises the global i18next singleton with inline English translations
 * so that tests can render translated text without a running HTTP backend.
 *
 * Imported from the global test setup (`src/test/setup.ts`) BEFORE any
 * component code runs, ensuring `useTranslation()` returns real strings.
 */
import { initReactI18next } from 'react-i18next';

import i18n from 'i18next';

// Read the canonical translation file directly from disk via a static import
// that Vitest resolves at compile time.
import en from '../../public/locales/en/translation.json';

// Re-initialise i18n (strip any plugins like HttpBackend that may have been
// added by the app-level `src/i18n/index.ts` if it executes first).
void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  // Disable suspense & backend so useTranslation() returns synchronously.
  react: {
    useSuspense: false,
  },
});

export default i18n;
