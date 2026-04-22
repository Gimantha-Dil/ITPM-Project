const { test, expect } = require('@playwright/test');

test.describe('Forgot Password Page (/forgot-password)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');
  });

  test('page loads with heading visible', async ({ page }) => {
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();
  });

  test('email input visible on Step 1', async ({ page }) => {
    await expect(page.locator('input').first()).toBeVisible();
  });

  test('Send OTP button visible', async ({ page }) => {
    await expect(page.locator('button[type="submit"], button:has-text("Send"), button:has-text("OTP")').first()).toBeVisible();
  });

  test('Back to Login link visible', async ({ page }) => {
    await expect(page.locator('a[href="/login"]')).toBeVisible();
  });

  test('email auto-appends @my.sliit.lk', async ({ page }) => {
    await page.locator('input').first().fill('it21000001');
    const value = await page.locator('input').first().inputValue();
    expect(value).toContain('@my.sliit.lk');
  });

  test('Back to Login navigates to /login', async ({ page }) => {
    await page.click('a[href="/login"]');
    await expect(page).toHaveURL(/\/login/);
  });
});
