import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Identity/Authentication Frontend E2E tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'https://localhost:4400',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    ignoreHTTPSErrors: true, // Required for local HTTPS
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Run local dev server before starting the tests
  webServer: {
    command: 'npm run start',
    url: 'https://localhost:4400',
    reuseExistingServer: !process.env['CI'],
    ignoreHTTPSErrors: true,
    timeout: 120000,
  },
});
