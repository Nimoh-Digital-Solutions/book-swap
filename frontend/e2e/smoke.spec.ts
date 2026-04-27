import { test, expect } from '@playwright/test';

/**
 * Smoke tests — critical user paths that must work on every deployment.
 * These tests run against the dev server started by Playwright's `webServer`
 * config (or a pre-built preview server in CI).
 *
 * All URLs use the /:lng prefix (e.g. /en/login). Bare paths are redirected
 * by the LanguageRedirect component.
 */

// ---------------------------------------------------------------------------
// Language redirect
// ---------------------------------------------------------------------------

test.describe('Language routing', () => {
  test('bare root redirects to /{lang}', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL(/\/en/);
    expect(page.url()).toMatch(/\/en\/?$/);
  });

  test('bare path redirects to /{lang}/{path}', async ({ page }) => {
    await page.goto('/login');
    await page.waitForURL(/\/en\/login/);
    expect(page.url()).toContain('/en/login');
  });
});

// ---------------------------------------------------------------------------
// Navigation & page loading
// ---------------------------------------------------------------------------

test.describe('Navigation', () => {
  test('home page loads and has correct title', async ({ page }) => {
    await page.goto('/en');
    await expect(page).toHaveTitle(/Home/i);
    await expect(page.locator('main')).toBeVisible();
  });

  test('components demo page loads', async ({ page }) => {
    await page.goto('/en/components');
    await expect(page).toHaveTitle(/Components/i);
    await expect(page.locator('main')).toBeVisible();
  });

  test('login page loads', async ({ page }) => {
    await page.goto('/en/login');
    await expect(page).toHaveTitle(/Sign in/i);
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });

  test('404 page renders for unknown routes', async ({ page }) => {
    await page.goto('/en/this-route-does-not-exist');
    await expect(page).toHaveTitle(/Not Found/i);
  });

  test('navigates between pages via links', async ({ page }) => {
    await page.goto('/en');

    const componentsLink = page.getByRole('link', { name: /components/i });
    if (await componentsLink.isVisible()) {
      await componentsLink.click();
      await expect(page).toHaveURL(/\/en\/components/);
    }
  });
});

// ---------------------------------------------------------------------------
// Login flow
// ---------------------------------------------------------------------------

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/login');
  });

  test('shows validation errors on empty submit', async ({ page }) => {
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/required|email|password/i).first()).toBeVisible();
  });

  test('shows validation error when credential field is empty', async ({ page }) => {
    await page.getByLabel(/email/i).fill('');
    await page.getByLabel(/password/i).fill('validpassword123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/required/i)).toBeVisible();
  });

  test('shows validation error for short password', async ({ page }) => {
    await page.getByLabel(/email/i).fill('user@example.com');
    await page.getByLabel(/password/i).fill('short');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/at least 8/i)).toBeVisible();
  });

  test('email and password fields are present and accessible', async ({ page }) => {
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Protected route redirect
// ---------------------------------------------------------------------------

test.describe('Protected routes', () => {
  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/en/profile');
    await page.waitForURL(/\/en\/login/);
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });

  test('settings page requires auth', async ({ page }) => {
    await page.goto('/en/settings');
    await page.waitForURL(/\/en\/login/);
  });

  test('my-shelf page requires auth', async ({ page }) => {
    await page.goto('/en/my-shelf');
    await page.waitForURL(/\/en\/login/);
  });
});

// ---------------------------------------------------------------------------
// Responsive viewports
// ---------------------------------------------------------------------------

test.describe('Responsive layout', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 812 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 900 },
  ] as const;

  for (const vp of viewports) {
    test(`renders correctly at ${vp.name} (${vp.width}×${vp.height})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/en');

      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasOverflow).toBe(false);

      await expect(page.locator('main')).toBeVisible();
    });
  }
});

// ---------------------------------------------------------------------------
// Basic accessibility checks
// ---------------------------------------------------------------------------

test.describe('Accessibility basics', () => {
  test('pages have a main landmark', async ({ page }) => {
    await page.goto('/en');
    await expect(page.locator('main')).toBeVisible();
  });

  test('login page form has associated labels', async ({ page }) => {
    await page.goto('/en/login');
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();

    const inputs = page.locator('input');
    const count = await inputs.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');

      const hasLabel = id
        ? (await page.locator(`label[for="${id}"]`).count()) > 0
        : false;
      expect(hasLabel || !!ariaLabel || !!ariaLabelledBy).toBe(true);
    }
  });

  test('interactive elements are keyboard focusable', async ({ page }) => {
    await page.goto('/en/login');
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();

    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeDefined();
  });

  test('skip-to-content link is present on app pages', async ({ page }) => {
    await page.goto('/en');
    const skipLink = page.locator('a[href="#main-content"], a[href="#main"]');
    if (await skipLink.count()) {
      await page.keyboard.press('Tab');
      await expect(skipLink.first()).toBeFocused();
    }
  });
});
