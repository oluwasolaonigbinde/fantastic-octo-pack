import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const baseURL = process.env.MANUAL_BASE_URL ?? "http://localhost:3000";
const apiBaseURL =
  process.env.MANUAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000/api/v1";
const summaryFile = path.resolve(process.cwd(), "tmp-live-slice2-auth-summary.json");

const uniqueSuffix = Date.now();
const engineer = {
  email: `slice2-engineer-${uniqueSuffix}@example.com`,
  password: "SlicePass123!",
};
const seedDistributor = {
  email: `slice2-distributor-${uniqueSuffix}@example.com`,
  password: "SlicePass123!",
};

const summary = {
  baseURL,
  apiBaseURL,
  engineerEmail: engineer.email,
  registerStatus: null,
  registerHasTokens: null,
  verificationCode: null,
  verifyStatus: null,
  firstDashboardUrl: null,
  logoutUrl: null,
  loginStatus: null,
  secondDashboardUrl: null,
  anonymousUsersStatus: null,
  anonymousUsersMessage: null,
  publicProfilesStatus: null,
  publicProfileCount: null,
  publicProfileRole: null,
  publicProfileId: null,
  publicListPageUrl: null,
  publicDetailPageUrl: null,
  publicListRequests: [],
  publicDetailRequests: [],
  seededPublicProfile: null,
  requestFailures: [],
  consoleErrors: [],
};

const writeSummary = () => {
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2), "utf8");
};

const parseJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const apiRequest = async (pathname, options = {}) => {
  const response = await fetch(`${apiBaseURL}${pathname}`, options);
  const payload = await parseJson(response);
  return { response, payload };
};

const ensurePublicProfileExists = async () => {
  const initialList = await apiRequest("/public/profiles?roles=distributor,oem&limit=1");

  if (
    initialList.response.ok &&
    Array.isArray(initialList.payload?.data?.docs) &&
    initialList.payload.data.docs.length > 0
  ) {
    const profile = initialList.payload.data.docs[0];
    summary.publicProfilesStatus = initialList.response.status;
    summary.publicProfileCount = initialList.payload.data.totalDocs ?? initialList.payload.data.docs.length;
    summary.publicProfileId = profile._id ?? null;
    summary.publicProfileRole = profile.role ?? null;
    return profile;
  }

  const registerResult = await apiRequest("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: seedDistributor.email,
      password: seedDistributor.password,
      role: "distributor",
    }),
  });

  if (!registerResult.response.ok || !registerResult.payload?.data?.verificationCode) {
    throw new Error("Unable to seed a public distributor profile for Slice 2 live verification.");
  }

  const verificationCode = registerResult.payload.data.verificationCode;
  const verifyResult = await apiRequest("/auth/verify-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: seedDistributor.email,
      verificationCode,
    }),
  });

  if (!verifyResult.response.ok || !verifyResult.payload?.data?._id) {
    throw new Error("Unable to verify the seeded public distributor profile.");
  }

  const accessToken = verifyResult.payload.data.tokens?.accessToken;
  if (accessToken) {
    await apiRequest("/auth/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        firstName: "Slice 2",
        lastName: "Distributor",
        phoneNumber: "+15550002000",
        address: "Public Profile Lane",
      }),
    });
  }

  summary.seededPublicProfile = verifyResult.payload.data._id;

  const refreshedList = await apiRequest("/public/profiles?roles=distributor,oem&limit=1");
  if (
    !refreshedList.response.ok ||
    !Array.isArray(refreshedList.payload?.data?.docs) ||
    refreshedList.payload.data.docs.length === 0
  ) {
    throw new Error("The public profiles endpoint stayed empty after seeding a verified distributor.");
  }

  const profile = refreshedList.payload.data.docs[0];
  summary.publicProfilesStatus = refreshedList.response.status;
  summary.publicProfileCount =
    refreshedList.payload.data.totalDocs ?? refreshedList.payload.data.docs.length;
  summary.publicProfileId = profile._id ?? null;
  summary.publicProfileRole = profile.role ?? null;
  return profile;
};

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: {
      cookies: [],
      origins: [],
    },
  });
  const page = await context.newPage();

  page.on("requestfailed", (request) => {
    summary.requestFailures.push({
      method: request.method(),
      url: request.url(),
      errorText: request.failure()?.errorText ?? "unknown",
    });
  });

  page.on("console", (message) => {
    if (message.type() === "error") {
      summary.consoleErrors.push(message.text());
    }
  });

  try {
    const publicProfile = await ensurePublicProfileExists();

    await page.goto(`${baseURL}/register`, { waitUntil: "networkidle" });
    await page.locator("input#engineer").check({ force: true });
    await page.getByLabel("Email").fill(engineer.email);
    await page.getByLabel("Password").fill(engineer.password);
    await page.locator("input#acceptTerms").check();

    const registerResponsePromise = page.waitForResponse((response) => {
      return (
        response.url().includes("/api/v1/auth/register") &&
        response.request().method() === "POST"
      );
    });

    await page.getByRole("button", { name: /create account/i }).click();
    const registerResponse = await registerResponsePromise;
    const registerJson = await registerResponse.json();
    summary.registerStatus = registerResponse.status();
    summary.registerHasTokens = Boolean(registerJson?.data?.tokens?.accessToken);
    summary.verificationCode = registerJson?.data?.verificationCode ?? null;

    await page.getByText(/account has been created/i).waitFor({ state: "visible" });
    await page.getByRole("button", { name: /proceed/i }).click();
    await page.waitForURL(
      new RegExp(
        `/verify-email\\?source=register&email=${encodeURIComponent(engineer.email).replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        )}`
      )
    );

    if (!summary.verificationCode) {
      throw new Error("Register response did not include a verification code.");
    }

    const verifyResponsePromise = page.waitForResponse((response) => {
      return (
        response.url().includes("/api/v1/auth/verify-email") &&
        response.request().method() === "POST"
      );
    });

    await page.locator('input[data-input-otp="true"]').fill(String(summary.verificationCode));
    await page.getByRole("button", { name: /verify code/i }).click();

    const verifyResponse = await verifyResponsePromise;
    summary.verifyStatus = verifyResponse.status();

    await page.waitForURL(/\/dashboard\/engineer$/);
    await page.getByRole("heading", { name: "My Dashboard" }).waitFor({
      state: "visible",
    });
    await page.getByText("Recent Job Requests", { exact: true }).waitFor({
      state: "visible",
    });
    summary.firstDashboardUrl = page.url();

    await page.getByRole("button", { name: "Logout" }).click({ force: true });
    await page.waitForURL(/\/login$/);
    summary.logoutUrl = page.url();

    const loginResponsePromise = page.waitForResponse((response) => {
      return (
        response.url().includes("/api/v1/auth/login") &&
        response.request().method() === "POST"
      );
    });

    await page.getByLabel("Email").fill(engineer.email);
    await page.getByLabel("Password").fill(engineer.password);
    await page.getByRole("button", { name: /^login$/i }).click();

    const loginResponse = await loginResponsePromise;
    summary.loginStatus = loginResponse.status();

    await page.waitForURL(/\/dashboard\/engineer$/);
    summary.secondDashboardUrl = page.url();

    const anonymousUsersResult = await apiRequest("/users");
    summary.anonymousUsersStatus = anonymousUsersResult.response.status;
    summary.anonymousUsersMessage = anonymousUsersResult.payload?.message ?? null;

    const publicListResponsePromise = page.waitForResponse((response) => {
      return (
        response.url().includes("/api/v1/public/profiles") &&
        !response.url().includes("/api/v1/public/profiles/") &&
        response.request().method() === "GET"
      );
    });
    await page.goto(`${baseURL}/distributor`, { waitUntil: "networkidle" });
    summary.publicListPageUrl = page.url();

    const publicListResponse = await publicListResponsePromise;
    summary.publicListRequests.push({
      url: publicListResponse.url(),
      status: publicListResponse.status(),
    });

    const detailPath =
      publicProfile.role === "oem"
        ? `/distributor/oem-profile?id=${publicProfile._id}`
        : `/distributor/profile?id=${publicProfile._id}`;

    const publicDetailResponsePromise = page.waitForResponse((response) => {
      return (
        response.url().includes(`/api/v1/public/profiles/${publicProfile._id}`) &&
        response.request().method() === "GET"
      );
    });

    await page.goto(`${baseURL}${detailPath}`, { waitUntil: "networkidle" });
    summary.publicDetailPageUrl = page.url();

    const publicDetailResponse = await publicDetailResponsePromise;
    summary.publicDetailRequests.push({
      url: publicDetailResponse.url(),
      status: publicDetailResponse.status(),
    });

    writeSummary();
    console.log(JSON.stringify(summary, null, 2));
  } catch (error) {
    writeSummary();
    console.error(JSON.stringify(summary, null, 2));
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exitCode = 1;
});
