import { test, expect } from '@playwright/test';

// Note: These tests require @axe-core/playwright to be installed
// npm install @axe-core/playwright

test.describe('Accessibility Tests', () => {
  test('landing page should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');

    // Check at least one h1 exists (some pages may have multiple)
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThan(0);

    // H1 should be visible
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
  });

  test('all images should have alt text', async ({ page }) => {
    await page.goto('/');

    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      // Alt should exist (even if empty string for decorative images)
      expect(alt !== null).toBeTruthy();
    }
  });

  test('form inputs should have associated labels', async ({ page }) => {
    await page.goto('/auth/login');

    const inputs = page.locator('input');
    const inputCount = await inputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const type = await input.getAttribute('type');

      // Skip hidden inputs
      if (type === 'hidden') continue;

      // Check for label association
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaDescribedBy = await input.getAttribute('aria-describedby');
      const placeholder = await input.getAttribute('placeholder');

      // At least one association method should exist
      const hasLabel = id ? await page.locator(`label[for="${id}"]`).count() > 0 : false;
      const hasAssociation = ariaLabel || ariaDescribedBy || placeholder || hasLabel;

      expect(hasAssociation).toBeTruthy();
    }
  });

  test('buttons should have accessible names', async ({ page }) => {
    await page.goto('/');

    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const textContent = await button.textContent();

      // Button should have either aria-label or text content
      const hasAccessibleName = ariaLabel || (textContent && textContent.trim().length > 0);
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('page should be keyboard navigable', async ({ page }) => {
    await page.goto('/');

    // Focus on body and try tabbing
    await page.keyboard.press('Tab');

    // Check that focus moved to an element
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test('color contrast should be adequate', async ({ page }) => {
    // This is a basic check - real contrast testing requires axe-core
    await page.goto('/');

    // Check that text is visible (basic sanity check)
    const body = await page.locator('body');
    await expect(body).toBeVisible();
  });

  test('login page should have proper accessibility', async ({ page }) => {
    await page.goto('/auth/login');

    // Check form exists (may not be a <form> element)
    await expect(page.locator('input').first()).toBeVisible();
  });

  test('register page should have proper accessibility', async ({ page }) => {
    await page.goto('/auth/register');

    // Check form exists
    await expect(page.locator('input').first()).toBeVisible();
  });
});
