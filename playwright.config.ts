import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60000,
  expect: {
    timeout: 15000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "Desktop Chrome",
      use: {
        browserName: "chromium",
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: "Mobile Chrome",
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        isMobile: true,
      },
    },
  ],
  webServer: {
    command: "pnpm dev",
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
