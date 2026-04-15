import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/i18n/locales/en.json';
import fr from '@/i18n/locales/fr.json';
import nl from '@/i18n/locales/nl.json';

const LANGUAGE_KEY = 'language';

async function getSavedLanguageAsync(): Promise<string> {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(LANGUAGE_KEY) || 'en';
    } catch {
      return 'en';
    }
  }
  try {
    return (await SecureStore.getItemAsync(LANGUAGE_KEY)) || 'en';
  } catch {
    return 'en';
  }
}

void getSavedLanguageAsync().then((lng) => {
  if (lng && lng !== i18n.language) {
    void i18n.changeLanguage(lng);
  }
});

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, fr: { translation: fr }, nl: { translation: nl } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

export function setLanguage(lng: string) {
  void i18n.changeLanguage(lng);
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(LANGUAGE_KEY, lng);
    } catch {
      /* storage unavailable */
    }
  } else {
    void SecureStore.setItemAsync(LANGUAGE_KEY, lng);
  }
}

export default i18n;
