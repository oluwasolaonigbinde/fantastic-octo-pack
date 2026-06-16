import { defineConfig } from "@playwright/test";

const frontendHost = process.env.PLAYWRIGHT_FRONTEND_HOST ?? "127.0.0.1";
const frontendPort = process.env.PLAYWRIGHT_FRONTEND_PORT ?? "3100";
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://${frontendHost}:${frontendPort}`;
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const explicitWebServerCommand = process.env.PLAYWRIGHT_WEB_SERVER_COMMAND;
const isRunnerManaged = process.env.PLAYWRIGHT_MANAGED_BY_RUNNER === "1";
const useNextStart = process.env.PLAYWRIGHT_USE_NEXT_START !== "0";
const defaultWebServerCommand = useNextStart
  ? `${npmCommand} run build && ${npmCommand} run start -- --hostname ${frontendHost} --port ${frontendPort}`
  : `${npmCommand} run dev -- --hostname ${frontendHost} --port ${frontendPort}`;
const shouldStartWebServer =
  !isRunnerManaged &&
  (Boolean(explicitWebServerCommand) || !process.env.PLAYWRIGHT_BASE_URL);

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  globalSetup: "./e2e/global-setup.ts",
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html"]],
  use: {
    baseURL,
    browserName: "chromium",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
  },
  webServer: shouldStartWebServer
    ? {
        command: explicitWebServerCommand ?? defaultWebServerCommand,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 300000,
      }
    : undefined,
});
