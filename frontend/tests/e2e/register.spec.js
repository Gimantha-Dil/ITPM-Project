const { test, expect } = require('@playwright/test');

test.describe('Register Page (/register)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
  });

  test('page loads with submit button visible', async ({ page }) => {
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('at least 4 input fields visible', async ({ page }) => {
    const count = await page.locator('input').count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('two password inputs visible (password + confirm)', async ({ page }) => {
    await expect(page.locator('input[type="password"]')).toHaveCount(2);
  });

  test('Login link points to /login', async ({ page }) => {
    await expect(page.locator('a[href="/login"]')).toBeVisible();
  });

  test('email auto-appends @my.sliit.lk', async ({ page }) => {
    await page.locator('input[placeholder="IT23365478@my.sliit.lk"]').fill('it21000001');
    const value = await page.locator('input[placeholder="IT23365478@my.sliit.lk"]').inputValue();
    expect(value).toContain('@my.sliit.lk');
  });

  test('full name strips numbers', async ({ page }) => {
    const nameInput = page.locator('input[placeholder="John Doe"]');
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill('Gimantha123');
    const value = await nameInput.inputValue();
    expect(value).not.toMatch(/[0-9]/);
  });

  test('full name strips special characters', async ({ page }) => {
    const nameInput = page.locator('input[placeholder="John Doe"]');
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill('Gim@ntha!');
    const value = await nameInput.inputValue();
    expect(value).not.toMatch(/[@!#$%]/);
  });

  test('mismatched passwords shows "Passwords do not match"', async ({ page }) => {
    await page.locator('input[placeholder="John Doe"]').fill('Gimantha Dilshan');
    await page.locator('input[placeholder="IT23365478@my.sliit.lk"]').fill('it21000001');
    await page.locator('input[placeholder="07XXXXXXXX"]').fill('0771234567');
    await page.locator('input[placeholder*="Min 8"]').fill('Password1!');
    await page.locator('input[placeholder="Repeat password"]').fill('Different1!');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });

  test('password toggle buttons exist', async ({ page }) => {
    expect(await page.locator('button[type="button"]').count()).toBeGreaterThanOrEqual(1);
  });

  test('Login link navigates to /login', async ({ page }) => {
    await page.click('a[href="/login"]');
    await expect(page).toHaveURL(/\/login/);
  });
});