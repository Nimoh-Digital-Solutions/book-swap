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
  ONBOARDING: '/onboarding',
  PROFILE: '/profile',
  PROFILE_EDIT: '/profile/edit',
  PUBLIC_PROFILE: '/profile/:id',
  SETTINGS: '/settings',
  MY_SHELF: '/my-shelf',
  ADD_BOOK: '/books/add',
  BOOK_DETAIL: '/books/:id',
  EDIT_BOOK: '/books/:id/edit',
  CATALOGUE: '/catalogue',
  EXCHANGES: '/exchanges',
  EXCHANGE_DETAIL: '/exchanges/:id',
  INCOMING_REQUESTS: '/exchanges/incoming',
  HOW_IT_WORKS: '/#how-it-works',
  COMMUNITY: '/#community',
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
  [PATHS.ONBOARDING]: {
    title: 'Set Your Location',
    description: 'Complete your account setup by setting your location',
  },
  [PATHS.PROFILE]: {
    title: 'Profile',
    description: 'View and edit your profile',
  },
  [PATHS.PROFILE_EDIT]: {
    title: 'Edit Profile',
    description: 'Edit your profile information',
  },
  [PATHS.PUBLIC_PROFILE]: {
    title: 'User Profile',
    description: 'View a user\'s public profile',
  },
  [PATHS.SETTINGS]: {
    title: 'Settings',
    description: 'Account settings',
  },
  [PATHS.CATALOGUE]: {
    title: 'Catalogue',
    description: 'Browse all available books in your community',
  },
  [PATHS.MY_SHELF]: {
    title: 'My Shelf',
    description: 'Manage your book listings',
  },
  [PATHS.ADD_BOOK]: {
    title: 'Add Book',
    description: 'List a new book for swapping',
  },
  [PATHS.BOOK_DETAIL]: {
    title: 'Book Details',
    description: 'View book details and request a swap',
  },
  [PATHS.EDIT_BOOK]: {
    title: 'Edit Book',
    description: 'Edit your book listing',
  },
  [PATHS.EXCHANGES]: {
    title: 'My Exchanges',
    description: 'Manage your book exchange requests',
  },
  [PATHS.EXCHANGE_DETAIL]: {
    title: 'Exchange Details',
    description: 'View exchange details and manage the swap',
  },
  [PATHS.INCOMING_REQUESTS]: {
    title: 'Incoming Requests',
    description: 'Review and respond to incoming swap requests',
  },
  [PATHS.NOT_FOUND]: {
    title: 'Page Not Found',
    description: 'The page you are looking for does not exist',
  },
} as const;
