import { test, expect } from '@playwright/test';

/**
 * Registration and onboarding flow spec.
 * Covers the critical path: Register → Email verify gate → Onboarding.
 *
 * These tests cover the frontend routing and form validation only.
 * They do NOT hit a real backend (the dev server handles MSW mocks in test mode).
 */

test.describe('Registration page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('loads registration form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /create|sign up|register/i })).toBeVisible();
  });

  test('shows required field validation on empty submit', async ({ page }) => {
    await page.getByRole('button', { name: /create account|register|sign up/i }).click();
    await expect(page.getByText(/required/i).first()).toBeVisible();
  });

  test('email field accepts valid input', async ({ page }) => {
    const emailInput = page.getByLabel(/email/i);
    await emailInput.fill('newuser@example.com');
    await expect(emailInput).toHaveValue('newuser@example.com');
  });

  test('password field is masked', async ({ page }) => {
    const passwordInput = page.getByLabel(/password/i).first();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('has link to login page', async ({ page }) => {
    await expect(page.getByRole('link', { name: /sign in|log in/i })).toBeVisible();
  });
});

test.describe('Onboarding page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/onboarding');
  });

  test('loads onboarding form with step indicator', async ({ page }) => {
    await expect(page.getByText(/step 2 of 2/i)).toBeVisible();
  });

  test('location input is present and labelled', async ({ page }) => {
    await expect(
      page.getByLabel(/city, neighborhood, or zip code/i),
    ).toBeVisible();
  });

  test('skip link navigates away', async ({ page }) => {
    await page.getByText(/skip for now/i).click();
    // Should navigate away from /onboarding
    await expect(page).not.toHaveURL(/\/onboarding/);
  });

  test('complete setup button is present', async ({ page }) => {
    await expect(page.getByRole('button', { name: /complete setup/i })).toBeVisible();
  });

  test('shows privacy note about location sharing', async ({ page }) => {
    await expect(page.getByText(/your exact address is never shared/i)).toBeVisible();
  });
});
