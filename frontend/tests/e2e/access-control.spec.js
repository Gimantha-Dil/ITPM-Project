const { test, expect } = require('@playwright/test');

test.describe('Protected Route — Redirect when not logged in', () => {
  const protectedRoutes = [
    '/', '/dashboard', '/notes', '/create-note', '/my-notes', '/my-purchases',
    '/kuppi-sessions', '/create-session', '/my-sessions', '/notifications',
    '/profile', '/analytics', '/bookmarks', '/payment-history', '/chat', '/chatbot',
  ];

  for (const route of protectedRoutes) {
    test(`${route} redirects to landing when not logged in`, async ({ page }) => {
      await page.goto('/login');
      await page.evaluate(() => localStorage.clear());
      await page.goto(route);
      await page.waitForTimeout(1500);
      const url = page.url();
      expect(url.includes('login') || url.match(/localhost:3000\/?$/)).toBeTruthy();
    });
  }
});
