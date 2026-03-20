/**
 * Shared accessibility (axe) test helper.
 *
 * Import this module in any test file that needs axe assertions.
 * Importing it automatically extends vitest's `expect` with
 * `toHaveNoViolations` so no extra setup step is required.
 *
 * Usage:
 *   import { axe } from '../../../test/a11y.setup';
 *
 *   it('has no a11y violations', async () => {
 *     const { container } = render(<MyComponent />);
 *     expect(await axe(container)).toHaveNoViolations();
 *   });
 */
import { configureAxe, toHaveNoViolations } from 'jest-axe';
import { expect } from 'vitest';

// Register the custom matcher globally for this test process.
expect.extend(toHaveNoViolations);

/**
 * Pre-configured axe instance for WCAG 2.1 Level AA checks.
 *
 * `color-contrast` is disabled because CSS custom properties are not
 * resolved in jsdom (no computed styles exist), which would produce
 * false positives for every component that uses CSS variables for colours.
 */
export const axe = configureAxe({
  rules: {
    'color-contrast': { enabled: false },
  },
});
