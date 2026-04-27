import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Reanimated shared values are designed to be mutated via .value
      'react-hooks/immutability': 'off',
      // setState inside useEffect is valid for data-fetching / subscription patterns
      'react-hooks/set-state-in-effect': 'off',

      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-require-imports': 'off',
      // Needed for declaration merging (e.g. ReactNavigation.RootParamList)
      '@typescript-eslint/no-empty-object-type': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    ignores: [
      'node_modules/',
      'ios/',
      'android/',
      '.expo/',
      'babel.config.js',
      'metro.config.js',
      'jest.setup.ts',
      '**/__tests__/**',
      '**/*.test.{ts,tsx}',
    ],
  },
);
