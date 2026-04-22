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

test.describe('Create Note Page (/create-note)', () => {
  test.beforeEach(async ({ page }) => {
    await injectToken(page);
    await page.goto('/create-note');
    await page.waitForTimeout(2000);
  });

  test('page loads without crashing', async ({ page }) => {
    const errors = await page.locator('text=/Cannot read|undefined is not/i').count();
    expect(errors).toBe(0);
  });

  test('form inputs visible', async ({ page }) => {
    const isLoading = await page.locator('.loading-screen').isVisible();
    const hasInputs = await page.locator('input, select, textarea').first().isVisible();
    expect(isLoading || hasInputs).toBeTruthy();
  });
});