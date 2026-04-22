const { test, expect } = require('@playwright/test');

const injectToken = async (page) => {
  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.setItem('token', 'test_token_placeholder');
    localStorage.setItem('user', JSON.stringify({
      _id: 'testuser123', fullName: 'Test Student',
      email: 'it21000001@my.sliit.lk', role: 'student', isEmailVerified: true,
    }));
  });
};

test.describe('Profile Page (/profile)', () => {
  test.beforeEach(async ({ page }) => {
    await injectToken(page);
    await page.goto('/profile');
    await page.waitForTimeout(1500);
  });

  test('page loads without crashing', async ({ page }) => {
    const errors = await page.locator('text=/Cannot read|undefined is not/i').count();
    expect(errors).toBe(0);
  });

  test('form or content visible', async ({ page }) => {
    const el = page.locator("input, button, form, .card");
    await expect(el.first()).toBeVisible({ timeout: 5000 });
  });

});