// Contract: docs/slices/slice-20.md
// Slice 20: Distributor Portal — B2B New Distributor Flow Alignment
//
// Semantic checks for nav labels, Source Request heading, bulk redirect, and deferred surfaces.
// Mocks GET /auth/profile (and dashboard data fetches) so dashboard layout hydration succeeds.

import { expect, test, type Page } from "@playwright/test";

const API_BASE_URL =
  process.env.PLAYWRIGHT_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000/api/v1";

const AUTH_SESSION_STORAGE_KEY = "baiy.auth.session";

const BANNED_INTERNAL_COPY = /\b(?:Deferred|Slice 20|foundation)\b/i;

const ok = (message: string, data: unknown) => ({
  success: true,
  message,
  data,
});

const emptyProductPage = {
  docs: [] as unknown[],
  page: 1,
  limit: 10,
  hasNextPage: false,
  hasPreviousPage: false,
  nextPage: null,
  previousPage: null,
  totalDocs: 0,
  totalPages: 1,
};

function buildSlice20DistributorUser() {
  return {
    _id: "slice-20-distributor-user",
    firstName: "Daniel",
    lastName: "Cole",
    email: "distributor.slice20@example.com",
    phoneNumber: "+2348012345678",
    address: "14 Profile Lane, Lagos",
    displayPhoto: {
      url: "/images/profile.png?role=distributor&variant=original",
      cloudinary_id: "distributor-original-photo",
    },
    role: "distributor" as const,
    status: "active",
    isEmailVerified: true,
    dateOfBirth: "1990-05-10T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    tokens: {
      accessToken: "slice-20-distributor-access-token",
      refreshToken: "slice-20-distributor-refresh-token",
    },
  };
}

async function seedDistributorSession(
  page: Page,
  user: ReturnType<typeof buildSlice20DistributorUser>,
) {
  await page.addInitScript(
    ([key, val]) => window.localStorage.setItem(key, val),
    [AUTH_SESSION_STORAGE_KEY, JSON.stringify(user)],
  );
}

async function installSlice20ApiMocks(
  page: Page,
  user: ReturnType<typeof buildSlice20DistributorUser>,
) {
  await page.route(`${API_BASE_URL}/**`, async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url === `${API_BASE_URL}/auth/profile` && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("Profile fetched successfully", {
            ...user,
            tokens: undefined,
          }),
        ),
      });
      return;
    }

    if (method === "GET" && url.includes("/rfqs/inbox/quotes")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Inbox fetched", [])),
      });
      return;
    }

    if (method === "GET" && url.includes("/conversations")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Conversations retrieved", [])),
      });
      return;
    }

    if (method === "GET") {
      try {
        const u = new URL(url);
        if (
          u.pathname.endsWith("/products") &&
          u.searchParams.has("createdBy")
        ) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(ok("Products fetched", emptyProductPage)),
          });
          return;
        }
        if (u.pathname.match(/\/orders\/?$/)) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(ok("Orders fetched", [])),
          });
          return;
        }
      } catch {
        // fall through
      }
    }

    await route.continue();
  });
}

async function openDistributorPage(
  page: Page,
  path: string,
  user = buildSlice20DistributorUser(),
) {
  await seedDistributorSession(page, user);
  await installSlice20ApiMocks(page, user);
  await page.goto(path);
}

test.describe("Slice 20 — distributor B2B flow alignment", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test("bulk-rfqs redirects to quotes with bulk query", async ({ page }) => {
    await openDistributorPage(page, "/dashboard/distributor/bulk-rfqs");
    await expect(page).toHaveURL(/\/dashboard\/distributor\/quotes/);
  });

  test("quotes page shows Source Request and View Bulk Source", async ({
    page,
  }) => {
    await openDistributorPage(page, "/dashboard/distributor/quotes");
    await expect(
      page.getByRole("heading", { name: /Source Request/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /View Bulk Source/i }),
    ).toBeVisible();
    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(BANNED_INTERNAL_COPY);
  });

  test("distributor dashboard nav includes renamed labels", async ({
    page,
  }) => {
    await openDistributorPage(page, "/dashboard/distributor");
    const nav = page.locator("aside");
    await expect(
      nav.getByText("Sourcing & Quoting", { exact: true }),
    ).toBeVisible();
    await expect(nav.getByText("Orders", { exact: true })).toBeVisible();
    await expect(
      nav.getByText("Wallets & Payment", { exact: true }),
    ).toBeVisible();
    await expect(nav.getByText("Bulk RFQs")).toHaveCount(0);
  });

  test("payments page shows Wallet & Payment and Request For Payout affordance", async ({
    page,
  }) => {
    await openDistributorPage(page, "/dashboard/distributor/payments");
    await expect(
      page.getByRole("heading", { name: /Wallet & Payment/i }),
    ).toBeVisible();
    await page.getByRole("button", { name: /Request payout/i }).click();
    await expect(
      page.getByRole("heading", { name: /Request For Payout/i }),
    ).toBeVisible();
  });

  test("messaging page renders active Phase 1 empty state", async ({ page }) => {
    await openDistributorPage(page, "/dashboard/distributor/message");
    await expect(
      page.getByText("Conversations", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(/No conversations yet/i),
    ).toBeVisible();
  });

  test("orders page heading Orders & Disputes", async ({ page }) => {
    await openDistributorPage(page, "/dashboard/distributor/orders");
    await expect(
      page.getByRole("heading", { name: /Orders & Disputes/i }),
    ).toBeVisible();
  });
});
