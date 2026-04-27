// Export main router
export { default as AppRouter } from './AppRouter';

// Re-export for convenience
export { PATHS, routeMetadata, routes } from './config';

// Locale routing utilities
export { LanguageRedirect } from './components/LanguageRedirect';
export { LanguageSync } from './components/LanguageSync';
export { isSupportedLanguage,localePath, stripLocalePath } from './utils/localePath';
