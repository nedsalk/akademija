import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/acceptance",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 10,
  reporter: [["dot"], ["html", { open: "never" }]],
  timeout: 10000,
  globalSetup: "playwright.global.setup.ts",
  globalTeardown: "playwright.global.teardown.ts",
  use: {
    javaScriptEnabled: false,
  },
  projects: [
    {
      name: "chrome",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
