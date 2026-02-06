import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev:stable",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL: process.env.DATABASE_URL ?? "file:./e2e.db",
      AUTH_SECRET: process.env.AUTH_SECRET ?? "e2e-secret",
      AUTH_ADMIN_EMAIL: process.env.AUTH_ADMIN_EMAIL ?? "admin@wymap.local",
      AUTH_ADMIN_PASSWORD: process.env.AUTH_ADMIN_PASSWORD ?? "ChangeMe123!",
      // Note: KIOSK_DEVICE_ID and KIOSK_SITE_ID are NOT set here
      // This allows E2E tests to validate devices against the database
    },
  },
});
