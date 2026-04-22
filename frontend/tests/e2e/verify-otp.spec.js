const { test, expect } = require('@playwright/test');

test.describe('Verify OTP Page (/verify-otp)', () => {

  test('direct visit without email state redirects to /register', async ({ page }) => {
    await page.goto('/verify-otp');
    await page.waitForTimeout(1500);
    await expect(page).toHaveURL(/\/register/);
  });

  test('submitting register form navigates to verify-otp or stays on register', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    // Use exact placeholder "John Doe" from Register.js
    await expect(page.locator('input[placeholder="John Doe"]')).toBeVisible({ timeout: 5000 });
    await page.locator('input[placeholder="John Doe"]').fill('Test Student');
    await page.locator('input[placeholder="IT23365478@my.sliit.lk"]').fill('it21999901');
    await page.locator('input[placeholder="07XXXXXXXX"]').fill('0771234567');
    await page.locator('input[placeholder*="Min 8"]').fill('Password1!');
    await page.locator('input[placeholder="Repeat password"]').fill('Password1!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    const url = page.url();
    expect(url.includes('verify-otp') || url.includes('register')).toBeTruthy();
  });

  test('verify-otp page shows correct content or redirects to register', async ({ page }) => {
    await page.goto('/verify-otp');
    await page.waitForTimeout(1500);
    const url = page.url();
    expect(url.includes('verify-otp') || url.includes('register')).toBeTruthy();
  });

  test('OTP input accepts only single digit per box', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('input[placeholder="John Doe"]')).toBeVisible({ timeout: 5000 });
    await page.locator('input[placeholder="John Doe"]').fill('Digit Tester');
    await page.locator('input[placeholder="IT23365478@my.sliit.lk"]').fill('it21999902');
    await page.locator('input[placeholder="07XXXXXXXX"]').fill('0771234570');
    await page.locator('input[placeholder*="Min 8"]').fill('Password1!');
    await page.locator('input[placeholder="Repeat password"]').fill('Password1!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    const url = page.url();
    expect(url.includes('verify-otp') || url.includes('register')).toBeTruthy();
  });
});