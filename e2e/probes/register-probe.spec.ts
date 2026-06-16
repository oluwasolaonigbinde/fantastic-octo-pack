import { expect, test } from "@playwright/test";

type ConsoleEvent = {
  type: string;
  text: string;
};

type RegisterRequestEvent = {
  method: string;
  url: string;
  headers: Record<string, string>;
  postData: string | null;
};

type RegisterResponseEvent = {
  method: string;
  url: string;
  status: number;
  ok: boolean;
  headers: Record<string, string>;
  body: string | null;
};

type RegisterFailureEvent = {
  method: string;
  url: string;
  errorText: string;
};

const registerApiPath = "/api/v1/auth/register";

test("register probe classifies the browser request path", async ({
  page,
}, testInfo) => {
  test.setTimeout(30_000);

  const consoleEvents: ConsoleEvent[] = [];
  const registerRequests: RegisterRequestEvent[] = [];
  const registerResponses: RegisterResponseEvent[] = [];
  const registerFailures: RegisterFailureEvent[] = [];

  page.on("console", (message) => {
    consoleEvents.push({
      type: message.type(),
      text: message.text(),
    });
  });

  page.on("pageerror", (error) => {
    consoleEvents.push({
      type: "pageerror",
      text: error.message,
    });
  });

  page.on("request", (request) => {
    if (!request.url().includes(registerApiPath)) {
      return;
    }

    registerRequests.push({
      method: request.method(),
      url: request.url(),
      headers: request.headers(),
      postData: request.postData(),
    });
  });

  page.on("requestfailed", (request) => {
    if (!request.url().includes(registerApiPath)) {
      return;
    }

    registerFailures.push({
      method: request.method(),
      url: request.url(),
      errorText: request.failure()?.errorText ?? "unknown",
    });
  });

  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes(registerApiPath) &&
      response.request().method() === "POST",
    { timeout: 15_000 }
  );

  await page.goto("/register");

  await page.locator("#email").fill(
    `register-probe-${Date.now()}@example.com`
  );
  await page.locator("#password").fill("ProbePass!123");
  await page.locator('label[for="engineer"]').click();
  await page.locator("#acceptTerms").check();
  await page.getByRole("button", { name: /create account/i }).click();

  let matchedResponse: Awaited<typeof responsePromise> | null = null;

  try {
    matchedResponse = await responsePromise;
  } catch {
    matchedResponse = null;
  }

  await page.waitForTimeout(1_500);

  let responseBody: string | null = null;
  if (matchedResponse) {
    try {
      responseBody = await matchedResponse.text();
    } catch {
      responseBody = null;
    }

    registerResponses.push({
      method: matchedResponse.request().method(),
      url: matchedResponse.url(),
      status: matchedResponse.status(),
      ok: matchedResponse.ok(),
      headers: matchedResponse.headers(),
      body: responseBody,
    });
  }

  const popupVisible = await page
    .getByText(/account has been created/i)
    .isVisible()
    .catch(() => false);
  const errorBannerVisible = await page
    .locator("text=/already exists|registration failed|failed/i")
    .first()
    .isVisible()
    .catch(() => false);
  const hasCorsConsole = consoleEvents.some((event) =>
    /cors|cross-origin|access-control-allow-origin/i.test(event.text)
  );

  const classification = (() => {
    if (registerFailures.length > 0) {
      return hasCorsConsole ? "cors" : "browser_transport";
    }

    if (!matchedResponse) {
      return "browser_transport";
    }

    if (!matchedResponse.ok()) {
      return "backend_route";
    }

    if (popupVisible) {
      return "success";
    }

    return "response_handling";
  })();

  const report = {
    baseURL: testInfo.project.use?.baseURL,
    classification,
    popupVisible,
    errorBannerVisible,
    hasCorsConsole,
    registerRequests,
    registerResponses,
    registerFailures,
    consoleEvents,
  };

  await testInfo.attach("register-probe", {
    body: JSON.stringify(report, null, 2),
    contentType: "application/json",
  });

  console.log(`register probe classification: ${classification}`);

  expect(registerRequests.length).toBeGreaterThan(0);
  expect(classification).not.toBe("browser_transport");
  expect(classification).not.toBe("cors");
});
