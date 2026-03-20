import sharedConfig from '@nimoh-digital-solutions/eslint-config';

/**
 * App-level ESLint config.
 * Extends the shared base. Add any project-specific overrides below.
 */
export default [
  ...sharedConfig,
  // Add app-specific rule overrides here, e.g.:
  // { files: ['src/features/**'], rules: { ... } },
];
