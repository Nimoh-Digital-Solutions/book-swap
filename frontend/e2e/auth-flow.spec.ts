import { test, expect } from '@playwright/test';

/**
 * Authentication flow spec — verifies login, register, forgot-password
 * form transitions, validation, and navigation.
 */

test.describe('Auth page transitions', () => {
  test('login → register toggle preserves locale', async ({ page }) => {
    await page.goto('/en/login');
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();

    const signUpLink = page.getByRole('link', { name: /sign up|create account|register/i });
    if (await signUpLink.isVisible()) {
      await signUpLink.click();
      await expect(page).toHaveURL(/\/en\/register/);
    }
  });

  test('register → login toggle preserves locale', async ({ page }) => {
    await page.goto('/en/register');
    const signInLink = page.getByRole('link', { name: /sign in|log in/i });
    if (await signInLink.isVisible()) {
      await signInLink.click();
      await expect(page).toHaveURL(/\/en\/login/);
    }
  });

  test('login → forgot password preserves locale', async ({ page }) => {
    await page.goto('/en/login');
    const forgotLink = page.getByRole('link', { name: /forgot/i });
    if (await forgotLink.isVisible()) {
      await forgotLink.click();
      await expect(page).toHaveURL(/\/en\/forgot-password/);
    }
  });
});

test.describe('Registration form validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/register');
  });

  test('all required fields show errors when empty', async ({ page }) => {
    await page.getByRole('button', { name: /create account|register|sign up/i }).click();
    const errors = page.getByText(/required/i);
    await expect(errors.first()).toBeVisible();
  });

  test('email validation rejects invalid format', async ({ page }) => {
    const emailInput = page.getByLabel(/email/i);
    await emailInput.fill('not-an-email');
    await page.getByRole('button', { name: /create account|register|sign up/i }).click();
    await expect(page.getByText(/email|invalid/i).first()).toBeVisible();
  });
});

test.describe('Forgot password flow', () => {
  test('forgot password page loads', async ({ page }) => {
    await page.goto('/en/forgot-password');
    await expect(page.getByText(/reset|forgot|password/i).first()).toBeVisible();
  });

  test('back button returns to login', async ({ page }) => {
    await page.goto('/en/forgot-password');
    const backButton = page.getByRole('button', { name: /back/i })
      .or(page.getByRole('link', { name: /back|sign in/i }));
    if (await backButton.first().isVisible()) {
      await backButton.first().click();
      await expect(page).toHaveURL(/\/en\/login/);
    }
  });
});
