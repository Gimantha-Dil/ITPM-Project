const { test, expect } = require('@playwright/test');

test.describe('Login Page (/login)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test('subtitle "Login to SLIIT Learning Platform" visible', async ({ page }) => {
    await expect(page.locator('text=Login to SLIIT Learning Platform')).toBeVisible();
  });

  test('time-based greeting shown (Good Morning/Afternoon/Evening/Night)', async ({ page }) => {
    const text = await page.locator('h1').innerText();
    expect(text).toMatch(/Good (Morning|Afternoon|Evening|Night)/i);
  });

  test('email input with SLIIT placeholder visible', async ({ page }) => {
    await expect(page.locator('input[placeholder="IT23365478@my.sliit.lk"]')).toBeVisible();
  });

  test('password input is hidden by default', async ({ page }) => {
    await expect(page.locator('input[placeholder="Enter password"]')).toHaveAttribute('type', 'password');
  });

  test('Login submit button visible', async ({ page }) => {
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('Forgot Password and Register links visible', async ({ page }) => {
    await expect(page.locator('a[href="/forgot-password"]')).toBeVisible();
    await expect(page.locator('a[href="/register"]')).toBeVisible();
  });

  test('typing student ID auto-appends @my.sliit.lk', async ({ page }) => {
    await page.fill('input[placeholder="IT23365478@my.sliit.lk"]', 'it21000001');
    const value = await page.inputValue('input[placeholder="IT23365478@my.sliit.lk"]');
    expect(value).toBe('it21000001@my.sliit.lk');
  });

  test('empty submit shows "Email is required"', async ({ page }) => {
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Email is required')).toBeVisible();
  });

  test('empty submit shows "Password is required"', async ({ page }) => {
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('short password shows "Minimum 6 characters required"', async ({ page }) => {
    await page.fill('input[placeholder="IT23365478@my.sliit.lk"]', 'it21000001');
    await page.fill('input[placeholder="Enter password"]', 'abc');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Minimum 6 characters required')).toBeVisible();
  });

  test('eye icon toggles password visibility', async ({ page }) => {
    await page.fill('input[placeholder="Enter password"]', 'mypassword');
    await page.locator('button[type="button"]').click();
    await expect(page.locator('input[placeholder="Enter password"]')).toHaveAttribute('type', 'text');
    await page.locator('button[type="button"]').click();
    await expect(page.locator('input[placeholder="Enter password"]')).toHaveAttribute('type', 'password');
  });

  test('Register link navigates to /register', async ({ page }) => {
    await page.click('a[href="/register"]');
    await expect(page).toHaveURL(/\/register/);
  });

  test('Forgot Password link navigates to /forgot-password', async ({ page }) => {
    await page.click('a[href="/forgot-password"]');
    await expect(page).toHaveURL(/\/forgot-password/);
  });
});
