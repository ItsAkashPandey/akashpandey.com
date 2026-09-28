import { defineConfig, devices } from "@playwright/test";

/**
 * The dev server compiles each route on its first request, which can take
 * 10-20s, so navigation and assertion timeouts are generous here.
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 2,
  retries: 1,
  timeout: 60_000,
  reporter: "html",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3100",
    trace: "on-first-retry",
    navigationTimeout: 60_000,
    actionTimeout: 15_000,
  },
  expect: {
    timeout: 15_000,
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3100",
    reuseExistingServer: true,
    timeout: 180_000,
    env: { PORT: "3100" },
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
        channel: "msedge",
      },
    },
    {
      name: "mobile",
      use: {
        ...devices["Pixel 7"],
        channel: "msedge",
      },
    },
  ],
});
