import { expect, test } from "@playwright/test";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

const buildUser = (overrides?: Partial<Record<string, unknown>>) => ({
  _id: "slice-01-user",
  firstName: "Slice",
  lastName: "User",
  phoneNumber: "",
  address: "",
  email: "slice1-buyer@example.com",
  displayPhoto: {
    url: "",
    cloudinary_id: "",
  },
  role: "buyer",
  status: "active",
  isEmailVerified: false,
  createdAt: "2026-03-08T00:00:00.000Z",
  updatedAt: "2026-03-08T00:00:00.000Z",
  ...overrides,
});

test.describe("Slice 1 - Deterministic Local Setup And Contract Baseline", () => {
  test("supported local auth startup path uses the frozen /api/v1 auth contract", async ({
    page,
  }) => {
    const registerPayloads: unknown[] = [];
    const verifyPayloads: unknown[] = [];
    const loginPayloads: unknown[] = [];
    const registeredUser = buildUser({
      verificationCode: 123456,
      tokens: {
        accessToken: "register-access-token",
        refreshToken: "register-refresh-token",
      },
    });
    const verifiedUser = buildUser({
      isEmailVerified: true,
      tokens: {
        accessToken: "verify-access-token",
        refreshToken: "verify-refresh-token",
      },
    });
    const loggedInUser = buildUser({
      isEmailVerified: true,
      tokens: {
        accessToken: "test-access-token",
        refreshToken: "test-refresh-token",
      },
    });

    await page.route(`${API_BASE_URL}/auth/register`, async (route) => {
      registerPayloads.push(route.request().postDataJSON());

      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "User registered successfully",
          data: registeredUser,
        }),
      });
    });

    await page.route(`${API_BASE_URL}/auth/verify-email`, async (route) => {
      verifyPayloads.push(route.request().postDataJSON());

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "Email verified successfully",
          data: verifiedUser,
        }),
      });
    });

    await page.route(`${API_BASE_URL}/auth/login`, async (route) => {
      loginPayloads.push(route.request().postDataJSON());

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "User logged in successfully",
          data: loggedInUser,
        }),
      });
    });

    await page.goto("/register");

    await expect(page.getByText(/^Distributor$/i)).toBeVisible();
    await expect(page.getByText(/^OEM$/i)).toBeVisible();
    await expect(page.getByText(/^Engineer$/i)).toBeVisible();
    await expect(page.getByText(/^Buyer$/i)).toBeVisible();
    await expect(page.getByText(/^Admin$/i)).toHaveCount(0);

    await page.getByLabel("Email").fill("slice1-buyer@example.com");
    await page.getByLabel("Password").fill("SlicePass123!");
    await page.getByLabel(/terms/i).check();
    await page.getByRole("button", { name: /create account/i }).click();

    await expect(page.getByText(/account has been created/i)).toBeVisible();
    await expect(registerPayloads).toEqual([
      {
        email: "slice1-buyer@example.com",
        password: "SlicePass123!",
        role: "buyer",
      },
    ]);

    await page.getByRole("button", { name: /proceed/i }).click();
    await expect(page).toHaveURL(
      /\/verify-email\?source=register&email=slice1-buyer%40example\.com$/,
    );

    await page.locator('input[data-input-otp="true"]').fill("123456");
    await page.getByRole("button", { name: /verify code/i }).click();

    await expect(verifyPayloads).toEqual([
      {
        email: "slice1-buyer@example.com",
        verificationCode: 123456,
      },
    ]);
    await expect(page).toHaveURL(/\/dashboard\/buyer$/);

    await page.goto("/login");
    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByText(
        /password reset remains legacy while slice 2 focuses on auth contract stabilization/i,
      ),
    ).toBeVisible();

    await page.getByLabel("Email").fill("slice1-buyer@example.com");
    await page.getByLabel("Password").fill("SlicePass123!");
    await page.getByRole("button", { name: /^login$/i }).click();

    await expect(loginPayloads).toEqual([
      {
        email: "slice1-buyer@example.com",
        password: "SlicePass123!",
      },
    ]);
    await expect(page).toHaveURL(/\/dashboard\/buyer$/);
  });
});
