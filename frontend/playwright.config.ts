import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for TAST E2E tests.
 *
 * Run:
 *   yarn e2e          — headless Chromium
 *   yarn e2e:headed   — headed Chromium (for debugging)
 *
 * The dev server is started automatically via `webServer` when not already
 * running on the base URL.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: process.env['CI'] ? 'github' : 'html',

  use: {
    baseURL: 'http://localhost:3070',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: 'yarn dev',
    url: 'http://localhost:3070',
    reuseExistingServer: !process.env['CI'],
    timeout: 60_000,
  },
});
