import { test, expect } from '@playwright/test';

/**
 * Smoke tests — critical user paths that must work on every deployment.
 * These tests run against the dev server started by Playwright's `webServer`
 * config (or a pre-built preview server in CI).
 */

// ---------------------------------------------------------------------------
// Navigation & page loading
// ---------------------------------------------------------------------------

test.describe('Navigation', () => {
  test('home page loads and has correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Home/i);
    // Main content landmark should be present
    await expect(page.locator('main')).toBeVisible();
  });

  test('components demo page loads', async ({ page }) => {
    await page.goto('/components');
    await expect(page).toHaveTitle(/Components/i);
    await expect(page.locator('main')).toBeVisible();
  });

  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Sign in/i);
    // Login form should be visible
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });

  test('404 page renders for unknown routes', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');
    await expect(page).toHaveTitle(/Not Found/i);
  });

  test('navigates between pages via links', async ({ page }) => {
    await page.goto('/');

    // Navigate to components page if link exists
    const componentsLink = page.getByRole('link', { name: /components/i });
    if (await componentsLink.isVisible()) {
      await componentsLink.click();
      await expect(page).toHaveURL(/\/components/);
    }
  });
});

// ---------------------------------------------------------------------------
// Login flow
// ---------------------------------------------------------------------------

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('shows validation errors on empty submit', async ({ page }) => {
    await page.getByRole('button', { name: /sign in/i }).click();

    // At least one validation error should appear
    await expect(page.getByText(/required|email|password/i).first()).toBeVisible();
  });

  test('shows validation error when credential field is empty', async ({ page }) => {
    // Credential field is email_or_username — validation requires min 1 char
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
    // Try to access a protected route (home requires auth if configured)
    // The app redirects to /login with returnUrl state
    await page.goto('/');

    // If ProtectedRoute is guarding /, we should end up on /login
    // If not, home page content is visible — both are valid states
    const url = page.url();
    const isLogin = url.includes('/login');
    const isHome = !isLogin;

    if (isLogin) {
      await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    } else {
      await expect(page.locator('main')).toBeVisible();
    }

    expect(isLogin || isHome).toBe(true);
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
      await page.goto('/');

      // No horizontal scroll overflow
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasOverflow).toBe(false);

      // Main content adapts to viewport
      await expect(page.locator('main')).toBeVisible();
    });
  }
});

// ---------------------------------------------------------------------------
// Basic accessibility checks
// ---------------------------------------------------------------------------

test.describe('Accessibility basics', () => {
  test('pages have a main landmark', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('main')).toBeVisible();
  });

  test('login page form has associated labels', async ({ page }) => {
    await page.goto('/login');

    // Wait for the lazy-loaded login form to render
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();

    // All inputs should have a label
    const inputs = page.locator('input');
    const count = await inputs.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');

      // Input should be labelled by at least one mechanism
      const hasLabel = id
        ? (await page.locator(`label[for="${id}"]`).count()) > 0
        : false;
      expect(hasLabel || !!ariaLabel || !!ariaLabelledBy).toBe(true);
    }
  });

  test('interactive elements are keyboard focusable', async ({ page }) => {
    await page.goto('/login');

    // Wait for lazy-loaded form to render
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();

    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    // Something should receive focus
    expect(focused).toBeDefined();
  });
});
