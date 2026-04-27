import { test, expect } from '@playwright/test';

/**
 * Locale routing spec — verifies the /:lng prefix routing system,
 * language redirect, and LanguageSync behaviour.
 */

test.describe('Locale prefix routing', () => {
  test('root / redirects to /en', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL(/\/en/);
    expect(page.url()).toMatch(/\/en\/?$/);
  });

  test('/login redirects to /en/login', async ({ page }) => {
    await page.goto('/login');
    await page.waitForURL(/\/en\/login/);
  });

  test('/register redirects to /en/register', async ({ page }) => {
    await page.goto('/register');
    await page.waitForURL(/\/en\/register/);
  });

  test('/catalogue redirects to /en/catalogue', async ({ page }) => {
    await page.goto('/catalogue');
    await page.waitForURL(/\/en\/catalogue/);
  });

  test('/privacy-policy redirects to /en/privacy-policy', async ({ page }) => {
    await page.goto('/privacy-policy');
    await page.waitForURL(/\/en\/privacy-policy/);
  });
});

test.describe('Supported languages', () => {
  test('/en serves the home page', async ({ page }) => {
    await page.goto('/en');
    await expect(page).toHaveTitle(/Home/i);
  });

  test('/fr serves the home page', async ({ page }) => {
    await page.goto('/fr');
    await expect(page).toHaveTitle(/Home/i);
  });

  test('/nl serves the home page', async ({ page }) => {
    await page.goto('/nl');
    await expect(page).toHaveTitle(/Home/i);
  });

  test('unsupported language code redirects to fallback', async ({ page }) => {
    await page.goto('/xx/login');
    await page.waitForURL(/\/(en|fr|nl)\/login/);
  });
});

test.describe('HTML lang attribute', () => {
  test('html lang is set to en for /en routes', async ({ page }) => {
    await page.goto('/en');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('html lang is set to fr for /fr routes', async ({ page }) => {
    await page.goto('/fr');
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBe('fr');
  });

  test('html lang is set to nl for /nl routes', async ({ page }) => {
    await page.goto('/nl');
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBe('nl');
  });
});
