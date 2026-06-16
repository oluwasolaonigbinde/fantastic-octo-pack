import { chromium } from "@playwright/test";

async function main() {
  const baseURL = process.env.MANUAL_BASE_URL ?? "http://localhost:3200";
  const email = `slice1-live-${Date.now()}@example.com`;
  const password = "SlicePass123!";

  const summary = {
    email,
    finalUrl: null,
    registerStatus: null,
    verifyStatus: null,
    loginStatus: null,
    registerHasTokens: null,
    verificationCode: null,
    authRequests: [],
    requestFailures: [],
    consoleErrors: [],
  };

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on("request", (request) => {
    const url = request.url();
    if (url.includes("/api/v1/auth/")) {
      summary.authRequests.push({
        method: request.method(),
        url,
      });
    }
  });

  page.on("requestfailed", (request) => {
    const url = request.url();
    if (url.includes("/auth/")) {
      summary.requestFailures.push({
        method: request.method(),
        url,
        errorText: request.failure()?.errorText ?? "unknown",
      });
    }
  });

  page.on("console", (message) => {
    if (message.type() === "error") {
      summary.consoleErrors.push(message.text());
    }
  });

  const waitForAuthResponse = (path) =>
    page.waitForResponse(
      (response) =>
        response.url().includes(path) &&
        response.request().method() === "POST",
      { timeout: 30000 }
    );

  try {
    await page.goto(`${baseURL}/register`, { waitUntil: "networkidle" });
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByLabel(/terms/i).check();

    const registerResponsePromise = waitForAuthResponse("/auth/register");

    await page.getByRole("button", { name: /create account/i }).click();

    const registerResponse = await registerResponsePromise;
    const registerJson = await registerResponse.json();
    summary.registerStatus = registerResponse.status();
    summary.registerHasTokens = Boolean(registerJson?.data?.tokens?.accessToken);
    summary.verificationCode = registerJson?.data?.verificationCode ?? null;

    await page.getByRole("button", { name: /proceed/i }).click();
    await page.waitForURL(/\/verify-email\?source=register$/);

    if (!summary.verificationCode) {
      throw new Error("Register response did not include a verificationCode.");
    }

    const verifyResponsePromise = waitForAuthResponse("/auth/verify-email");

    await page.locator('input[data-input-otp="true"]').fill(String(summary.verificationCode));
    await page.getByRole("button", { name: /verify code/i }).click();

    const verifyResponse = await verifyResponsePromise;
    summary.verifyStatus = verifyResponse.status();

    await page.getByRole("button", { name: /proceed to login/i }).click();
    await page.waitForURL(/\/login$/);

    const loginResponsePromise = waitForAuthResponse("/auth/login");

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /^login$/i }).click();

    const loginResponse = await loginResponsePromise;
    summary.loginStatus = loginResponse.status();

    await page.waitForURL(/\/dashboard\/buyer$/);
    summary.finalUrl = page.url();
  } catch (error) {
    summary.finalUrl = page.url();
    console.error(JSON.stringify(summary, null, 2));
    throw error;
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
