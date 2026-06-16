import { expect, test, type Page } from "@playwright/test";

const API_BASE_URL =
  process.env.PLAYWRIGHT_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000/api/v1";

const AUTH_SESSION_STORAGE_KEY = "baiy.auth.session";

const ok = (message: string, data: unknown) => ({
  success: true,
  message,
  data,
});

const MOCK_SERVICE_REQUEST = {
  _id: "507f1f77bcf86cd799439011",
  jobType: "Installation",
  equipmentName: "Philips Ultrasound Machine",
  brand: "Philips",
  preferredDate: "2026-02-03T00:00:00.000Z",
  preferredTime: "Morning (8:00 AM - 12:00 PM)",
  serviceDescription:
    "New CT scanner needs installation and calibration. Room is prepared with proper electrical setup and cooling system.",
  requester: {
    _id: "buyer-sr-test-user",
    firstName: "Amina",
    lastName: "Bello",
    email: "buyer.sr-test@example.com",
  },
  engineer: {
    _id: "engineer-sr-test-user",
    firstName: "Emeka",
    lastName: "Adebayo",
    email: "engineer.sr-test@example.com",
  },
  status: "pending",
  createdAt: "2026-02-01T00:00:00.000Z",
  updatedAt: "2026-02-01T00:00:00.000Z",
};

async function seedBuyerSession(page: Page) {
  const user = {
    _id: "buyer-sr-test-user",
    firstName: "Amina",
    lastName: "Bello",
    email: "buyer.sr-test@example.com",
    phoneNumber: "+2348012345678",
    role: "buyer",
    status: "active",
    isEmailVerified: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    tokens: {
      accessToken: "buyer-sr-test-access-token",
      refreshToken: "buyer-sr-test-refresh-token",
    },
  };
  await page.addInitScript(
    ([key, val]) => window.localStorage.setItem(key, val),
    [AUTH_SESSION_STORAGE_KEY, JSON.stringify(user)],
  );
}

async function stubServiceRequestsList(page: Page) {
  await page.route(`${API_BASE_URL}/**`, async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url === `${API_BASE_URL}/auth/profile` && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("Profile fetched successfully", {
            _id: "buyer-sr-test-user",
            firstName: "Amina",
            lastName: "Bello",
            email: "buyer.sr-test@example.com",
            role: "buyer",
            status: "active",
            isEmailVerified: true,
          }),
        ),
      });
      return;
    }

    if (url.includes("/service-requests") && method === "GET") {
      const pathname = new URL(url).pathname;
      const isListPath =
        pathname.endsWith("/service-requests") || pathname.endsWith("/service-requests/");
      if (isListPath) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(
            ok("Service requests fetched successfully", [MOCK_SERVICE_REQUEST]),
          ),
        });
        return;
      }
    }

    await route.continue();
  });
}

test.describe("Buyer service requests list", () => {
  test("shows equipment, status, and assigned engineer from API", async ({ page }) => {
    await seedBuyerSession(page);
    await stubServiceRequestsList(page);

    await page.goto("/dashboard/buyer/service-request");

    await expect(
      page.getByRole("heading", { name: "Service Requests", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("cell", { name: /Philips Ultrasound Machine/i })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Pending" })).toBeVisible();
    await expect(page.getByRole("cell", { name: /Emeka Adebayo/i })).toBeVisible();
  });
});
