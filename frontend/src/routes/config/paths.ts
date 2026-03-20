/**
 * PATHS
 *
 * Centralised route path constants. Import directly from this file
 * (not from the @routes barrel) in components such as Header to avoid
 * circular dependencies: routesConfig → AppLayout → Header → routesConfig.
 *
 * @example
 * import { PATHS } from '@routes/config/paths';
 */
export const PATHS = {
  HOME: '/',
  COMPONENTS_DEMO: '/components',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  PASSWORD_RESET_CONFIRM: '/password-reset/confirm',
  SETTINGS: '/settings',
  NOT_FOUND: '*',
} as const;

/**
 * routeMetadata
 *
 * Static metadata for each route: document title and SEO description.
 * Co-located with PATHS to keep route config in one place and allow pages
 * to import metadata without depending on the full routesConfig module.
 *
 * @example
 * import { PATHS, routeMetadata } from '@routes/config/paths';
 * useDocumentTitle(routeMetadata[PATHS.HOME].title);
 */
export const routeMetadata = {
  [PATHS.HOME]: {
    title: 'Home',
    description: 'Welcome to React Starter Kit',
  },
  [PATHS.COMPONENTS_DEMO]: {
    title: 'Components Library',
    description: 'Comprehensive showcase of all reusable components and design patterns',
  },
  [PATHS.LOGIN]: {
    title: 'Sign in',
    description: 'Sign in to your account',
  },
  [PATHS.REGISTER]: {
    title: 'Create Account',
    description: 'Create a new account',
  },
  [PATHS.FORGOT_PASSWORD]: {
    title: 'Forgot Password',
    description: 'Reset your account password',
  },
  [PATHS.PASSWORD_RESET_CONFIRM]: {
    title: 'Set New Password',
    description: 'Choose a new password for your account',
  },
  [PATHS.SETTINGS]: {
    title: 'Settings',
    description: 'Account settings',
  },
  [PATHS.NOT_FOUND]: {
    title: 'Page Not Found',
    description: 'The page you are looking for does not exist',
  },
} as const;
