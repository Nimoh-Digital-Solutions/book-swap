import { test, expect } from '@playwright/test';

/**
 * Anonymous browse spec — verifies visitors can explore books
 * without creating an account (US-101 AC: "Visitor can browse nearby books
 * without signing up").
 *
 * These tests run against the dev server and do NOT require a backend.
 * They verify the frontend routing and UI only.
 */

test.describe('Anonymous browse', () => {
  test('browse page is accessible without login', async ({ page }) => {
    await page.goto('/en/catalogue');
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('browse page shows title', async ({ page }) => {
    await page.goto('/en/catalogue');
    await expect(page.getByRole('heading', { name: /browse|discover/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('browse page shows location prompt for visitors with no location', async ({ page }) => {
    await page.goto('/en/catalogue');
    await expect(
      page.getByText(/set your location|sign in|browse nearby/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('browse URL is bookmarkable and shareable', async ({ page }) => {
    await page.goto('/en/catalogue');
    expect(page.url()).toContain('/en/catalogue');
  });

  test('bare /catalogue redirects to /en/catalogue', async ({ page }) => {
    await page.goto('/catalogue');
    await page.waitForURL(/\/en\/catalogue/);
    expect(page.url()).toContain('/en/catalogue');
  });
});
