import { defineConfig } from "@playwright/test";
export default defineConfig({ testDir: "./tests/browser", timeout: 60000, workers: 1, use: { baseURL: "http://localhost:3100", headless: true, screenshot: "only-on-failure" }, webServer: { command: "npm run start -- --port 3100", url: "http://localhost:3100", reuseExistingServer: !process.env.CI, timeout: 60000 }, reporter: "list" });
