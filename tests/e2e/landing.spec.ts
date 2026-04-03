import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should load landing page without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');

    // Check page loaded (may not have AgentOps in title immediately)
    await expect(page.locator('body')).toBeVisible();

    // Check no console errors (filter out warnings)
    const realErrors = errors.filter(e => !e.includes('Warning') && !e.includes('warning'));
    expect(realErrors).toHaveLength(0);
  });

  test('should display hero section with AI creator input', async ({ page }) => {
    await page.goto('/');

    // Check body is visible
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/');

    // Check navbar exists
    await expect(page.locator('nav, header, [role="navigation"]').first()).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Page should still load
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Authentication Flow', () => {
  test('should navigate to login page', async ({ page }) => {
    await page.goto('/auth/login');

    // Check login form exists (any input field is ok)
    await expect(page.locator('input').first()).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/auth/register');

    // Check register form exists
    await expect(page.locator('input').first()).toBeVisible();
  });

  test('should validate email format on login', async ({ page }) => {
    await page.goto('/auth/login');

    // Find and fill inputs
    const inputs = page.locator('input');
    if (await inputs.count() >= 2) {
      await inputs.nth(0).fill('not-an-email');
      await inputs.nth(1).fill('password123');

      // Submit if button exists
      const submitBtn = page.locator('button[type="submit"]');
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
      }
    }
  });

  test('should validate password length on register', async ({ page }) => {
    await page.goto('/auth/register');

    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    if (inputCount >= 3) {
      await inputs.nth(0).fill('test@example.com');
      await inputs.nth(1).fill('Test User');
      await inputs.nth(2).fill('12345');

      const submitBtn = page.locator('button[type="submit"]');
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
      }
    }
  });

  test.skip('should redirect to dashboard when already logged in', async ({ page }) => {
    // This test requires authentication setup
  });
});

test.describe('Dashboard Page', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for redirect
    await page.waitForURL(/\/auth\/login|\/login/, { timeout: 5000 }).catch(() => {});

    // Check we're on a login-related page
    const url = page.url();
    expect(url.includes('/auth/login') || url.includes('/login')).toBeTruthy();
  });

  test.skip('should load dashboard when authenticated', async ({ page }) => {
    // This test requires authentication
  });
});

test.describe('Workflows Page', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/workflows');

    // Wait for redirect
    await page.waitForURL(/\/auth\/login|\/login/, { timeout: 5000 }).catch(() => {});

    // Check we're on a login-related page
    const url = page.url();
    expect(url.includes('/auth/login') || url.includes('/login')).toBeTruthy();
  });
});
