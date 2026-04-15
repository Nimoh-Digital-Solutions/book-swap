import { test, expect } from '@playwright/test';

/**
 * Legal pages spec — verifies privacy policy and terms of service
 * are publicly accessible and render correctly.
 */

test.describe('Privacy Policy', () => {
  test('page loads and shows heading', async ({ page }) => {
    await page.goto('/en/privacy-policy');
    await expect(page).toHaveTitle(/Privacy/i);
    await expect(page.locator('main')).toBeVisible();
  });

  test('page is accessible without authentication', async ({ page }) => {
    await page.goto('/en/privacy-policy');
    await expect(page).not.toHaveURL(/\/login/);
  });
});

test.describe('Terms of Service', () => {
  test('page loads and shows heading', async ({ page }) => {
    await page.goto('/en/terms-of-service');
    await expect(page).toHaveTitle(/Terms/i);
    await expect(page.locator('main')).toBeVisible();
  });

  test('page is accessible without authentication', async ({ page }) => {
    await page.goto('/en/terms-of-service');
    await expect(page).not.toHaveURL(/\/login/);
  });
});

test.describe('Footer legal links', () => {
  test('footer contains privacy and terms links', async ({ page }) => {
    await page.goto('/en');

    const footer = page.locator('footer');
    await expect(footer.getByRole('link', { name: /privacy/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /terms/i })).toBeVisible();
  });

  test('footer privacy link navigates correctly', async ({ page }) => {
    await page.goto('/en');
    await page.locator('footer').getByRole('link', { name: /privacy/i }).click();
    await expect(page).toHaveURL(/\/en\/privacy-policy/);
  });

  test('footer terms link navigates correctly', async ({ page }) => {
    await page.goto('/en');
    await page.locator('footer').getByRole('link', { name: /terms/i }).click();
    await expect(page).toHaveURL(/\/en\/terms-of-service/);
  });
});
