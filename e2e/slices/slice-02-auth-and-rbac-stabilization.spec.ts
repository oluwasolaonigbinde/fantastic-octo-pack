import { test } from "@playwright/test";
import { engineerTest, expect } from "../auth/fixtures";

const API_BASE_URL =
  process.env.PLAYWRIGHT_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000/api/v1";

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

test.describe("Slice 2 - Auth And RBAC Stabilization", () => {
  test("unauthenticated engineer routes redirect to login", async ({ browser }) => {
    const context = await browser.newContext({
      storageState: {
        cookies: [],
        origins: [],
      },
    });
    const page = await context.newPage();

    await page.goto("/dashboard/engineer");

    await expect(page).toHaveURL(/\/login/);

    await context.close();
  });

  engineerTest("engineer auth state reaches the protected dashboard and can logout", async ({
    page,
  }) => {
    await page.goto("/dashboard/engineer");

    await expect(
      page.getByRole("heading", { name: "My Dashboard" })
    ).toBeVisible();
    await expect(page.getByText("Recent Job Requests", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Logout" }).click({ force: true });

    await expect(page).toHaveURL(/\/login/);
  });

  test("engineer can complete the live auth path while public profiles remain browseable", async ({
    browser,
    request,
  }) => {
    const uniqueSuffix = Date.now();
    const engineer = {
      email: `slice2-engineer-${uniqueSuffix}@example.com`,
      password: "SlicePass123!",
    };
    const distributor = {
      email: `slice2-public-distributor-${uniqueSuffix}@example.com`,
      password: "SlicePass123!",
      role: "distributor",
    };

    let publicProfilesResponse = await request.get(
      `${API_BASE_URL}/public/profiles?roles=distributor,oem&limit=1`
    );
    let publicProfilesPayload = await publicProfilesResponse.json();

    if (
      !publicProfilesResponse.ok() ||
      !Array.isArray(publicProfilesPayload?.data?.docs) ||
      publicProfilesPayload.data.docs.length === 0
    ) {
      const registerDistributorResponse = await request.post(
        `${API_BASE_URL}/auth/register`,
        {
          data: distributor,
        }
      );
      expect(registerDistributorResponse.status()).toBe(201);

      const registerDistributorPayload = await registerDistributorResponse.json();
      const distributorVerificationCode =
        registerDistributorPayload?.data?.verificationCode;

      expect(distributorVerificationCode).toBeTruthy();

      const verifyDistributorResponse = await request.post(
        `${API_BASE_URL}/auth/verify-email`,
        {
          data: {
            email: distributor.email,
            verificationCode: distributorVerificationCode,
          },
        }
      );
      expect(verifyDistributorResponse.status()).toBe(200);

      publicProfilesResponse = await request.get(
        `${API_BASE_URL}/public/profiles?roles=distributor,oem&limit=1`
      );
      publicProfilesPayload = await publicProfilesResponse.json();
    }

    expect(publicProfilesResponse.ok()).toBeTruthy();
    expect(Array.isArray(publicProfilesPayload?.data?.docs)).toBeTruthy();
    expect(publicProfilesPayload.data.docs.length).toBeGreaterThan(0);

    const publicProfile = publicProfilesPayload.data.docs[0] as {
      _id: string;
      role: "distributor" | "oem";
    };

    const context = await browser.newContext({
      storageState: {
        cookies: [],
        origins: [],
      },
    });
    const page = await context.newPage();

    try {
      await page.goto("/register");
      await page.locator('label[for="engineer"]').click();
      await page.getByLabel("Email").fill(engineer.email);
      await page.getByLabel("Password").fill(engineer.password);
      await page.locator("input#acceptTerms").check();

      const registerResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes("/api/v1/auth/register") &&
          response.request().method() === "POST"
      );

      await page.getByRole("button", { name: /create account/i }).click();

      const registerResponse = await registerResponsePromise;
      const registerPayload = await registerResponse.json();
      const verificationCode = registerPayload?.data?.verificationCode;

      expect(registerResponse.status()).toBe(201);
      expect(verificationCode).toBeTruthy();
      await expect(page.getByText(/account has been created/i)).toBeVisible();

      await page.getByRole("button", { name: /proceed/i }).click();
      await expect(page).toHaveURL(
        new RegExp(
          `/verify-email\\?source=register&email=${escapeRegex(
            encodeURIComponent(engineer.email)
          )}$`
        )
      );

      const verifyResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes("/api/v1/auth/verify-email") &&
          response.request().method() === "POST"
      );

      await page
        .locator('input[data-input-otp="true"]')
        .fill(String(verificationCode));
      await page.getByRole("button", { name: /verify code/i }).click();

      const verifyResponse = await verifyResponsePromise;
      expect(verifyResponse.status()).toBe(200);
      await expect(page).toHaveURL(/\/dashboard\/engineer$/);
      await expect(
        page.getByRole("heading", { name: "My Dashboard" })
      ).toBeVisible();
      await expect(
        page.getByText("Recent Job Requests", { exact: true })
      ).toBeVisible();

      await page.getByRole("button", { name: "Logout" }).click({ force: true });
      await expect(page).toHaveURL(/\/login$/);

      const loginResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes("/api/v1/auth/login") &&
          response.request().method() === "POST"
      );

      await page.getByLabel("Email").fill(engineer.email);
      await page.getByLabel("Password").fill(engineer.password);
      await page.getByRole("button", { name: /^login$/i }).click();

      const loginResponse = await loginResponsePromise;
      expect(loginResponse.status()).toBe(200);
      await expect(page).toHaveURL(/\/dashboard\/engineer$/);

      const anonymousUsersResponse = await request.get(`${API_BASE_URL}/users`);
      expect(anonymousUsersResponse.status()).toBe(401);

      const publicListResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes("/api/v1/public/profiles") &&
          !response.url().includes("/api/v1/public/profiles/") &&
          response.request().method() === "GET"
      );

      await page.goto("/distributor");

      const publicListResponse = await publicListResponsePromise;
      expect(publicListResponse.ok()).toBeTruthy();

      const detailPath =
        publicProfile.role === "oem"
          ? `/distributor/oem-profile?id=${publicProfile._id}`
          : `/distributor/profile?id=${publicProfile._id}`;

      const publicDetailResponsePromise = page.waitForResponse(
        (response) =>
          response
            .url()
            .includes(`/api/v1/public/profiles/${publicProfile._id}`) &&
          response.request().method() === "GET"
      );

      await page.goto(detailPath);

      const publicDetailResponse = await publicDetailResponsePromise;
      expect(publicDetailResponse.ok()).toBeTruthy();
    } finally {
      await context.close();
    }
  });
});
