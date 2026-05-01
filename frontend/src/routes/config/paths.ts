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
  BROWSE: '/browse',
  CATALOGUE: '/catalogue',
  MAP: '/map',
  EXCHANGES: '/exchanges',
  EXCHANGE_DETAIL: '/exchanges/:id',
  INCOMING_REQUESTS: '/exchanges/incoming',
  PRIVACY_POLICY: '/privacy-policy',
  TERMS_OF_SERVICE: '/terms-of-service',
  ACCOUNT_DELETION: '/account-deletion',
  SUPPORT: '/support',
  HOW_IT_WORKS: '/how-it-works',
  COMMUNITY: '/community',
  NOTIFICATION_UNSUBSCRIBE: '/notifications/unsubscribe/:token',
  EMAIL_VERIFY_PENDING: '/auth/email/verify-pending',
  EMAIL_VERIFY_CONFIRM: '/auth/email/verify',
  SOCIAL_AUTH_CALLBACK: '/auth/verified',
  SOCIAL_AUTH_ERROR: '/auth/verify-error',
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
 * <SEOHead title={...} description={...} path={PATHS.HOME} />
 */
export const routeMetadata = {
  [PATHS.HOME]: {
    title: 'Home',
    description: 'BookSwap is a free, location-aware book exchange platform. Discover, swap, and share physical books with people in your neighbourhood.',
  },
  [PATHS.COMPONENTS_DEMO]: {
    title: 'Components Library',
    description: 'Comprehensive showcase of all reusable components and design patterns',
  },
  [PATHS.LOGIN]: {
    title: 'Sign in',
    description: 'Sign in to your BookSwap account to browse, swap, and share books with your community.',
  },
  [PATHS.REGISTER]: {
    title: 'Create Account',
    description: 'Join BookSwap for free and start swapping books with readers near you.',
  },
  [PATHS.FORGOT_PASSWORD]: {
    title: 'Forgot Password',
    description: 'Reset your BookSwap account password.',
  },
  [PATHS.PASSWORD_RESET_CONFIRM]: {
    title: 'Set New Password',
    description: 'Choose a new password for your BookSwap account.',
  },
  [PATHS.ONBOARDING]: {
    title: 'Set Your Location',
    description: 'Complete your BookSwap account setup by setting your location so we can show books near you.',
  },
  [PATHS.PROFILE]: {
    title: 'Profile',
    description: 'View your BookSwap profile, reading stats, and swap history.',
  },
  [PATHS.PROFILE_EDIT]: {
    title: 'Edit Profile',
    description: 'Update your BookSwap profile information and preferences.',
  },
  [PATHS.PUBLIC_PROFILE]: {
    title: 'User Profile',
    description: 'View this reader\'s public profile, book listings, and community ratings on BookSwap.',
  },
  [PATHS.SETTINGS]: {
    title: 'Settings',
    description: 'Manage your BookSwap account, notifications, and privacy preferences.',
  },
  [PATHS.BROWSE]: {
    title: 'Browse Books',
    description: 'Discover books available for swapping in your community. Filter by genre, condition, and distance.',
  },
  [PATHS.CATALOGUE]: {
    title: 'Book Catalogue',
    description: 'Browse the full catalogue of books available for swapping on BookSwap.',
  },
  [PATHS.MAP]: {
    title: 'Book Map',
    description: 'Explore an interactive map of books available for swapping near you. Find readers in your neighbourhood.',
  },
  [PATHS.MY_SHELF]: {
    title: 'My Shelf',
    description: 'Manage your book listings on BookSwap. Add, edit, or remove books from your shelf.',
  },
  [PATHS.ADD_BOOK]: {
    title: 'Add Book',
    description: 'List a new book for swapping on BookSwap. Scan the ISBN or search by title.',
  },
  [PATHS.BOOK_DETAIL]: {
    title: 'Book Details',
    description: 'View book details, photos, and condition. Request a swap with the owner.',
  },
  [PATHS.EDIT_BOOK]: {
    title: 'Edit Book',
    description: 'Update your book listing details, condition, and photos.',
  },
  [PATHS.EXCHANGES]: {
    title: 'My Exchanges',
    description: 'Track and manage your active book exchange requests on BookSwap.',
  },
  [PATHS.EXCHANGE_DETAIL]: {
    title: 'Exchange Details',
    description: 'View exchange details, chat with the other reader, and complete your book swap.',
  },
  [PATHS.INCOMING_REQUESTS]: {
    title: 'Incoming Requests',
    description: 'Review and respond to incoming swap requests from other BookSwap readers.',
  },
  [PATHS.PRIVACY_POLICY]: {
    title: 'Privacy Policy',
    description: 'Learn how BookSwap collects, uses, and protects your personal data in compliance with GDPR.',
  },
  [PATHS.TERMS_OF_SERVICE]: {
    title: 'Terms of Service',
    description: 'Read the rules and conditions for using the BookSwap platform.',
  },
  [PATHS.ACCOUNT_DELETION]: {
    title: 'Account & Data Deletion',
    description: 'Learn how to delete your BookSwap account and request removal of your personal data.',
  },
  [PATHS.SUPPORT]: {
    title: 'Support',
    description: 'Get help with BookSwap: contact support, FAQ, common issues, and links to privacy, terms, and account deletion.',
  },
  [PATHS.HOW_IT_WORKS]: {
    title: 'How BookSwap Works',
    description: 'Your complete guide to swapping books on BookSwap: list, discover, request, and meet up.',
  },
  [PATHS.COMMUNITY]: {
    title: 'BookSwap Community',
    description: 'Meet the BookSwap community. See live stats, recent activity, and what readers near you are sharing.',
  },
  [PATHS.EMAIL_VERIFY_PENDING]: {
    title: 'Verify Your Email',
    description: 'Check your inbox for a verification link to activate your BookSwap account.',
  },
  [PATHS.EMAIL_VERIFY_CONFIRM]: {
    title: 'Email Verification',
    description: 'Confirming your email address for BookSwap.',
  },
  [PATHS.SOCIAL_AUTH_CALLBACK]: {
    title: 'Signing in…',
    description: 'Completing Google sign-in to BookSwap.',
  },
  [PATHS.SOCIAL_AUTH_ERROR]: {
    title: 'Sign-in Failed',
    description: 'An error occurred during social sign-in. Please try again.',
  },
  [PATHS.NOT_FOUND]: {
    title: 'Page Not Found',
    description: 'The page you are looking for does not exist on BookSwap.',
  },
} as const;
