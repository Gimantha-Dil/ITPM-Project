const { test, expect } = require('@playwright/test');

test.describe('Landing Page (/)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('page loads without errors', async ({ page }) => {
    const text = await page.locator('body').innerText();
    expect(text.trim().length).toBeGreaterThan(10);
  });

  test('Login button visible', async ({ page }) => {
    await expect(page.locator('a[href="/login"]').first()).toBeVisible();
  });

  test('Register Free button visible', async ({ page }) => {
    await expect(page.locator('a[href="/register"]').first()).toBeVisible();
  });

  test('"Explore All Categories" section visible', async ({ page }) => {
    await expect(page.locator('text=Explore All Categories')).toBeVisible();
  });

  test('category link navigates to /notes?category=', async ({ page }) => {
    await page.locator('a[href*="/notes?category="]').first().click();
    await expect(page).toHaveURL(/\/notes\?category=/);
  });

  test('unknown route redirects to /', async ({ page }) => {
    await page.goto('/unknown-route-xyz');
    await page.waitForTimeout(1000);
    expect(page.url()).toMatch(/localhost:3000\/?$/);
  });
});
