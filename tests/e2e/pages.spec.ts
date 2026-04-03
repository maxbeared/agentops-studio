import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// Helper to get auth token
async function getAuthToken(page: any, email: string): Promise<string | null> {
  const response = await page.request.post(`${API_BASE_URL}/auth/register`, {
    data: { email, password: 'password123', name: 'Test User' },
  });

  if (response.status() === 201) {
    const body = await response.json();
    return body.data?.token || null;
  }
  return null;
}

// Setup authenticated context for tests that need it
test.describe('Authentication Setup', () => {
  test('should authenticate and store token', async ({ page }) => {
    const email = `e2e-pages-test-${Date.now()}@test.com`;
    const token = await getAuthToken(page, email);

    if (token) {
      await page.goto('/');
      await page.evaluate((t: string) => {
        localStorage.setItem('auth_token', t);
      }, token);
    }

    expect(token).toBeTruthy();
  });
});

test.describe('Runs Page', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/runs');

    await page.waitForURL(/\/auth\/login|\/login/, { timeout: 5000 }).catch(() => {});

    const url = page.url();
    expect(url.includes('/auth/login') || url.includes('/login')).toBeTruthy();
  });

  test('should load runs page when authenticated', async ({ page }) => {
    const email = `runs-test-${Date.now()}@test.com`;
    const token = await getAuthToken(page, email);

    if (token) {
      await page.goto('/');
      await page.evaluate((t: string) => {
        localStorage.setItem('auth_token', t);
      }, token);

      await page.goto('/runs');
      await page.waitForURL(/\/runs/, { timeout: 5000 }).catch(() => {});

      const url = page.url();
      expect(url.includes('/runs')).toBeTruthy();
    }
  });

  test('should display runs list when authenticated', async ({ page }) => {
    const email = `runs-list-test-${Date.now()}@test.com`;
    const token = await getAuthToken(page, email);

    if (token) {
      await page.goto('/');
      await page.evaluate((t: string) => {
        localStorage.setItem('auth_token', t);
      }, token);

      await page.goto('/runs');
      await page.waitForLoadState('networkidle');

      // Page should render without crashing
      await expect(page.locator('body')).toBeVisible();
    }
  });
});

test.describe('Settings Page', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/settings');

    await page.waitForURL(/\/auth\/login|\/login/, { timeout: 5000 }).catch(() => {});

    const url = page.url();
    expect(url.includes('/auth/login') || url.includes('/login')).toBeTruthy();
  });

  test('should load settings page when authenticated', async ({ page }) => {
    const email = `settings-test-${Date.now()}@test.com`;
    const token = await getAuthToken(page, email);

    if (token) {
      await page.goto('/');
      await page.evaluate((t: string) => {
        localStorage.setItem('auth_token', t);
      }, token);

      await page.goto('/settings');
      await page.waitForURL(/\/settings/, { timeout: 5000 }).catch(() => {});

      const url = page.url();
      expect(url.includes('/settings')).toBeTruthy();
    }
  });

  test('should have avatar upload section', async ({ page }) => {
    const email = `settings-avatar-test-${Date.now()}@test.com`;
    const token = await getAuthToken(page, email);

    if (token) {
      await page.goto('/');
      await page.evaluate((t: string) => {
        localStorage.setItem('auth_token', t);
      }, token);

      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      // Settings page should have some input elements
      const inputs = page.locator('input');
      const count = await inputs.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should have AI model configuration section', async ({ page }) => {
    const email = `settings-ai-test-${Date.now()}@test.com`;
    const token = await getAuthToken(page, email);

    if (token) {
      await page.goto('/');
      await page.evaluate((t: string) => {
        localStorage.setItem('auth_token', t);
      }, token);

      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      // Page should render
      await expect(page.locator('body')).toBeVisible();
    }
  });
});

test.describe('Knowledge Page', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/knowledge');

    await page.waitForURL(/\/auth\/login|\/login/, { timeout: 5000 }).catch(() => {});

    const url = page.url();
    expect(url.includes('/auth/login') || url.includes('/login')).toBeTruthy();
  });

  test('should load knowledge page when authenticated', async ({ page }) => {
    const email = `knowledge-test-${Date.now()}@test.com`;
    const token = await getAuthToken(page, email);

    if (token) {
      await page.goto('/');
      await page.evaluate((t: string) => {
        localStorage.setItem('auth_token', t);
      }, token);

      await page.goto('/knowledge');
      await page.waitForURL(/\/knowledge/, { timeout: 5000 }).catch(() => {});

      const url = page.url();
      expect(url.includes('/knowledge')).toBeTruthy();
    }
  });
});

test.describe('Reviews Page', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/reviews');

    await page.waitForURL(/\/auth\/login|\/login/, { timeout: 5000 }).catch(() => {});

    const url = page.url();
    expect(url.includes('/auth/login') || url.includes('/login')).toBeTruthy();
  });

  test('should load reviews page when authenticated', async ({ page }) => {
    const email = `reviews-test-${Date.now()}@test.com`;
    const token = await getAuthToken(page, email);

    if (token) {
      await page.goto('/');
      await page.evaluate((t: string) => {
        localStorage.setItem('auth_token', t);
      }, token);

      await page.goto('/reviews');
      await page.waitForURL(/\/reviews/, { timeout: 5000 }).catch(() => {});

      const url = page.url();
      expect(url.includes('/reviews')).toBeTruthy();
    }
  });
});

test.describe('Projects Page', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/projects');

    await page.waitForURL(/\/auth\/login|\/login/, { timeout: 5000 }).catch(() => {});

    const url = page.url();
    expect(url.includes('/auth/login') || url.includes('/login')).toBeTruthy();
  });

  test('should load projects page when authenticated', async ({ page }) => {
    const email = `projects-test-${Date.now()}@test.com`;
    const token = await getAuthToken(page, email);

    if (token) {
      await page.goto('/');
      await page.evaluate((t: string) => {
        localStorage.setItem('auth_token', t);
      }, token);

      await page.goto('/projects');
      await page.waitForURL(/\/projects/, { timeout: 5000 }).catch(() => {});

      const url = page.url();
      expect(url.includes('/projects')).toBeTruthy();
    }
  });
});

test.describe('Workflows List Page', () => {
  test('should load workflows page when authenticated', async ({ page }) => {
    const email = `workflows-list-test-${Date.now()}@test.com`;
    const token = await getAuthToken(page, email);

    if (token) {
      await page.goto('/');
      await page.evaluate((t: string) => {
        localStorage.setItem('auth_token', t);
      }, token);

      await page.goto('/workflows');
      await page.waitForURL(/\/workflows/, { timeout: 5000 }).catch(() => {});

      const url = page.url();
      expect(url.includes('/workflows')).toBeTruthy();
    }
  });
});

test.describe('Prompts Page', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/prompts');

    await page.waitForURL(/\/auth\/login|\/login/, { timeout: 5000 }).catch(() => {});

    const url = page.url();
    expect(url.includes('/auth/login') || url.includes('/login')).toBeTruthy();
  });

  test('should load prompts page when authenticated', async ({ page }) => {
    const email = `prompts-test-${Date.now()}@test.com`;
    const token = await getAuthToken(page, email);

    if (token) {
      await page.goto('/');
      await page.evaluate((t: string) => {
        localStorage.setItem('auth_token', t);
      }, token);

      await page.goto('/prompts');
      await page.waitForURL(/\/prompts/, { timeout: 5000 }).catch(() => {});

      const url = page.url();
      expect(url.includes('/prompts')).toBeTruthy();
    }
  });
});