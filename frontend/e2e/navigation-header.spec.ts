import { test, expect } from '@playwright/test';

/**
 * Header navigation and branding spec.
 * Ensures the global navigation is accessible, responsive, and locale-aware.
 */

test.describe('Header navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en');
  });

  test('BookSwap branding is visible', async ({ page }) => {
    await expect(page.getByText('BookSwap')).toBeVisible();
  });

  test('Browse link navigates to catalogue', async ({ page }) => {
    const browseLink = page.getByRole('link', { name: /browse/i });
    if (await browseLink.isVisible()) {
      await browseLink.click();
      await expect(page).toHaveURL(/\/en\/catalogue/);
    }
  });

  test('Sign In link is shown for unauthenticated users', async ({ page }) => {
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
  });

  test('Sign In link navigates to login with locale', async ({ page }) => {
    await page.getByRole('link', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/en\/login/);
  });

  test('navigation links have locale prefix', async ({ page }) => {
    const links = page.locator('nav a[href]');
    const count = await links.count();

    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      if (href && href.startsWith('/') && !href.startsWith('/#')) {
        expect(href).toMatch(/^\/en\//);
      }
    }
  });
});

test.describe('Header responsive', () => {
  test('mobile: desktop nav links are hidden', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/en');

    const desktopNav = page.locator('.hidden.md\\:flex');
    await expect(desktopNav).not.toBeVisible();
  });

  test('desktop: nav links are visible', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en');

    const browseLink = page.getByRole('link', { name: /browse/i });
    await expect(browseLink).toBeVisible();
  });
});
