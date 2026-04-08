import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  // Run only chromium for local tests to save time
  // In CI, you can run all browsers
  projects: process.env.CI
    ? [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
      ]
    : [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
      ],
  // Only start web server if explicitly enabled
  webServer: process.env.PLAYWRIGHT_START_SERVER
    ? {
        command: 'cd apps/web && bun dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120 * 1000,
      }
    : undefined,
});
