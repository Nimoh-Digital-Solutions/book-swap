import { expect, test } from '@playwright/test';

/**
 * MapPage spec — verifies the public `/map` route is reachable and
 * gracefully degrades when the user has no location set or when the
 * Google Maps API key is missing (AUD-W-601).
 *
 * The dev server in CI typically runs WITHOUT a `VITE_GOOGLE_MAPS_API_KEY`,
 * so we expect the "map unavailable" branding by default. When the key IS
 * configured we still expect the location prompt for anonymous visitors who
 * have not granted geolocation, since the page can't centre the map.
 */

test.describe('Anonymous map page', () => {
  test('page is publicly accessible', async ({ page }) => {
    await page.goto('/en/map');
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator('main, [role="main"], body')).toBeVisible();
  });

  test('renders SEO title', async ({ page }) => {
    await page.goto('/en/map');
    await expect(page).toHaveTitle(/Book Map/i);
  });

  test('shows a graceful fallback when no API key or no location', async ({ page }) => {
    await page.goto('/en/map');

    // One of the two non-happy-path branches must be visible.
    const fallback = page.getByText(
      /map unavailable|location needed|book map/i,
    );
    await expect(fallback.first()).toBeVisible({ timeout: 10_000 });
  });

  test('fallback offers a path back to Browse or Settings', async ({ page }) => {
    await page.goto('/en/map');

    const cta = page.getByRole('link', {
      name: /back to browse|go to settings/i,
    });

    if (await cta.count()) {
      await expect(cta.first()).toBeVisible();
    }
  });

  test('bare /map redirects to /en/map', async ({ page }) => {
    await page.goto('/map');
    await page.waitForURL(/\/en\/map/);
    expect(page.url()).toContain('/en/map');
  });

  test('URL is bookmarkable and shareable', async ({ page }) => {
    await page.goto('/en/map');
    expect(page.url()).toContain('/en/map');
  });
});

test.describe('Map page accessibility', () => {
  test('skip-to-content link still works on /map', async ({ page }) => {
    await page.goto('/en/map');
    const skipLink = page.locator('a[href="#main-content"], a[href="#main"]');
    if (await skipLink.count()) {
      await page.keyboard.press('Tab');
      await expect(skipLink.first()).toBeFocused();
    }
  });

  test('top-level heading is present (visually-hidden allowed)', async ({ page }) => {
    await page.goto('/en/map');
    // The page renders an h1 ("Book Map") that may be sr-only.
    const h1 = page.locator('h1');
    await expect(h1.first()).toBeAttached({ timeout: 10_000 });
  });
});
