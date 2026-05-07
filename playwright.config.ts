import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",
  use: {
    baseURL: process.env.WEB_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Start servers before tests if they aren't running
  // webServer: [
  //   { command: "pnpm --filter api dev", port: 4000, reuseExistingServer: true },
  //   { command: "pnpm --filter web dev", port: 3000, reuseExistingServer: true },
  // ],
});
