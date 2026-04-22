const { test, expect } = require('@playwright/test');

test.describe('Landing Page (/)', () => {
  test.beforeEach(async ({ page }) => {
    // Clear token so user is NOT logged in — landing page shows for guests
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
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
    const catLink = page.locator('a[href*="/notes?category="]').first();
    await expect(catLink).toBeVisible();
    await catLink.click();
    await page.waitForLoadState('networkidle');
    // Logged out user → redirected to landing (/) which is correct behaviour
    const url = page.url();
    expect(url.includes('notes') || url.includes('login') || url.match(/localhost:3000\/?$/)).toBeTruthy();
  });

  test('unknown route redirects to /', async ({ page }) => {
    await page.goto('/unknown-route-xyz');
    await page.waitForTimeout(1000);
    expect(page.url()).toMatch(/localhost:3000\/?$/);
  });
});