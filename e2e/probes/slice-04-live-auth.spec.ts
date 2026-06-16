import fs from "node:fs";
import path from "node:path";

import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test";

const API_BASE_URL =
  process.env.PLAYWRIGHT_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000/api/v1";
const LOCAL_ROLE_ACCOUNTS_PATH = path.resolve(
  process.cwd(),
  "..",
  "..",
  "scripts",
  "local-role-auth.playwright.accounts.json",
);

type SupportedRole = "buyer" | "distributor" | "oem" | "engineer";

type RoleCredentials = {
  email: string;
  password: string;
  seeded?: boolean;
};

const localRoleAccounts: Partial<Record<SupportedRole, RoleCredentials>> = fs.existsSync(
  LOCAL_ROLE_ACCOUNTS_PATH,
)
  ? (JSON.parse(
      fs.readFileSync(LOCAL_ROLE_ACCOUNTS_PATH, "utf8"),
    ) as Partial<Record<SupportedRole, RoleCredentials>>)
  : {};

const roleDashboardExpectations = {
  buyer: {
    path: "/dashboard/buyer",
    heading: "My Dashboard",
    module: "Weekly Quotation Analysis",
  },
  distributor: {
    path: "/dashboard/distributor",
    heading: "Dashboard Overview",
    module: "Top 10 Most Requested Product",
  },
  oem: {
    path: "/dashboard/oem",
    heading: "Dashboard Overview",
    module: "Recent Listing Request",
  },
  engineer: {
    path: "/dashboard/engineer",
    heading: "My Dashboard",
    module: "Recent Job Requests",
  },
} satisfies Record<
  SupportedRole,
  {
    path: string;
    heading: string;
    module: string;
  }
>;

const sleep = (timeMs: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, timeMs);
  });

async function postWithRateLimitRetry(
  request: APIRequestContext,
  pathname: string,
  data: Record<string, unknown>,
  attempts = 5,
) {
  let lastResponse: Awaited<ReturnType<APIRequestContext["post"]>> | null = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const response = await request.post(`${API_BASE_URL}${pathname}`, {
      data,
    });

    if (response.status() !== 429) {
      return response;
    }

    lastResponse = response;
    await sleep(1500 * (attempt + 1));
  }

  if (!lastResponse) {
    throw new Error(`Unable to post ${pathname}: no response received.`);
  }

  return lastResponse;
}

async function createRoleAccount(request: APIRequestContext, role: SupportedRole) {
  const uniqueSuffix = `${role}-${Date.now()}`;
  const email = `live-${uniqueSuffix}@example.com`;
  const password = "SlicePass123!";

  const registerResponse = await postWithRateLimitRetry(request, "/auth/register", {
    firstName: role === "oem" ? "Olivia" : role.charAt(0).toUpperCase() + role.slice(1),
    lastName: "Live",
    email,
    phoneNumber: "+2348012345678",
    acceptTerms: true,
  });
  expect(registerResponse.status()).toBe(201);

  const registerPayload = await registerResponse.json();
  const pendingRegistrationId =
    registerPayload?.data?.pendingRegistration?.pendingRegistrationId;
  const verificationCode = registerPayload?.data?.verificationCode;

  expect(pendingRegistrationId).toBeTruthy();
  expect(verificationCode).toBeTruthy();

  const verifyResponse = await postWithRateLimitRetry(request, "/auth/verify-email", {
    pendingRegistrationId,
    verificationCode,
  });
  expect(verifyResponse.status()).toBe(200);

  const roleResponse = await postWithRateLimitRetry(request, "/auth/register", {
    pendingRegistrationId,
    role,
  });
  expect(roleResponse.status()).toBe(200);

  const createAccountResponse = await postWithRateLimitRetry(
    request,
    "/auth/create-account",
    {
      pendingRegistrationId,
      password,
    },
  );
  expect(createAccountResponse.status()).toBe(201);

  return { email, password, seeded: false };
}

async function getRoleAccount(request: APIRequestContext, role: SupportedRole) {
  const seededAccount = localRoleAccounts[role];

  if (seededAccount?.email && seededAccount.password) {
    return {
      email: seededAccount.email,
      password: seededAccount.password,
      seeded: true,
    };
  }

  return createRoleAccount(request, role);
}

async function loginAndAssertDashboard(
  page: Page,
  credentials: { email: string; password: string },
  role: SupportedRole,
) {
  const expectation = roleDashboardExpectations[role];

  await page.goto("/login");

  const loginResponsePromise = page.waitForResponse(
    (response) =>
      response.url() === `${API_BASE_URL}/auth/login` &&
      response.request().method() === "POST",
  );
  const profileHydrateResponsePromise = page.waitForResponse(
    (response) =>
      response.url() === `${API_BASE_URL}/auth/profile` &&
      response.request().method() === "GET",
  );

  await page.getByLabel(/email address/i).fill(credentials.email);
  await page.getByLabel(/^password$/i).fill(credentials.password);
  await page.getByRole("button", { name: /sign in/i }).click();

  const loginResponse = await loginResponsePromise;
  const profileHydrateResponse = await profileHydrateResponsePromise;

  expect(loginResponse.status()).toBe(200);
  expect(profileHydrateResponse.status()).toBe(200);

  await expect(page).toHaveURL(new RegExp(`${expectation.path}$`));
  await expect(page.getByRole("heading", { name: expectation.heading })).toBeVisible();
  await expect(page.getByText(expectation.module, { exact: true })).toBeVisible();
  await expect(page.locator("main").last()).not.toContainText(
    /\b(?:Deferred|Foundation)\b/i,
  );
}

test("live Slice 4 buyer stays on the repaired dashboard and can update the shared profile workflow", async ({
  page,
  request,
}) => {
  const buyer = await createRoleAccount(request, "buyer");
  const updatedProfile = {
    firstName: "Jordan",
    lastName: "Bankole",
    phoneNumber: "+2348098765432",
    dateOfBirth: "1990-05-12",
    address: "25 Updated Profile Street, Abuja",
  };
  const updatedPassword = "SlicePass456!";

  await loginAndAssertDashboard(page, buyer, "buyer");

  await page.getByRole("link", { name: /go to profile/i }).click();
  await expect(page).toHaveURL(/\/dashboard\/buyer\/profile$/);
  await expect(page.getByRole("heading", { name: /my profile/i })).toBeVisible();

  const profileUpdateResponsePromise = page.waitForResponse(
    (response) =>
      response.url() === `${API_BASE_URL}/auth/profile` &&
      response.request().method() === "PATCH",
  );

  await page.getByRole("button", { name: /edit personal info/i }).click();
  await page.getByLabel(/^first name$/i).fill(updatedProfile.firstName);
  await page.getByLabel(/^last name$/i).fill(updatedProfile.lastName);
  await page.getByLabel(/^phone number$/i).fill(updatedProfile.phoneNumber);
  await page.getByLabel(/^date of birth$/i).fill(updatedProfile.dateOfBirth);
  await page.getByLabel(/^address$/i).fill(updatedProfile.address);
  await page
    .getByRole("button", { name: /update personal information/i })
    .click();

  const profileUpdateResponse = await profileUpdateResponsePromise;
  expect(profileUpdateResponse.status()).toBe(200);
  await expect(
    page.getByText(/your personal info has been updated succesfully/i),
  ).toBeVisible();
  await page.getByRole("button", { name: /proceed/i }).click();
  await expect(page).toHaveURL(/\/dashboard\/buyer\/profile$/);
  await expect(page.getByText(updatedProfile.phoneNumber)).toBeVisible();
  await expect(page.getByText(updatedProfile.address)).toBeVisible();

  const changePasswordResponsePromise = page.waitForResponse(
    (response) =>
      response.url() === `${API_BASE_URL}/auth/change-password` &&
      response.request().method() === "POST",
  );

  await page.getByRole("button", { name: /password update/i }).click();
  await page.getByLabel(/current password/i).fill(buyer.password);
  await page.getByLabel(/new password/i).fill(updatedPassword);
  await page.getByLabel(/confirm password/i).fill(updatedPassword);
  await page.getByRole("button", { name: /save password/i }).click();

  const changePasswordResponse = await changePasswordResponsePromise;
  expect(changePasswordResponse.status()).toBe(200);
  await expect(
    page.getByText(/you have successfully updated your password/i),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard\/buyer\/profile$/);
});

for (const role of ["distributor", "oem", "engineer"] as const) {
  test(`live Slice 4 ${role} login resolves /dashboard to the role-matched overview`, async ({
    page,
    request,
  }) => {
    const account = await getRoleAccount(request, role);

    await loginAndAssertDashboard(page, account, role);
  });
}
