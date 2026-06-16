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

const buildPaginated = <T,>(
  docs: T[],
  page = 1,
  totalDocs = docs.length,
  totalPages = 1,
) => ({
  docs,
  page,
  limit: 10,
  hasNextPage: page < totalPages,
  hasPreviousPage: page > 1,
  nextPage: page < totalPages ? page + 1 : null,
  previousPage: page > 1 ? page - 1 : null,
  totalDocs,
  totalPages,
});

const buildDistributorSession = () => ({
  _id: "probe-distributor-user",
  firstName: "Daniel",
  lastName: "Cole",
  email: "daniel.cole@example.com",
  phoneNumber: "+2348012345678",
  role: "distributor",
  status: "active",
  isEmailVerified: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  tokens: {
    accessToken: "probe-access-token",
    refreshToken: "probe-refresh-token",
  },
});

async function seedDistributorSession(page: Page) {
  const user = buildDistributorSession();
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [AUTH_SESSION_STORAGE_KEY, JSON.stringify(user)],
  );
  return user;
}

test("distributor catalogue uses backend-backed listed filters and stable summary queries", async ({
  page,
}) => {
  const sessionUser = await seedDistributorSession(page);
  const productQueries: Array<Record<string, string>> = [];

  const approvedProduct = {
    _id: "prod-approved",
    name: "Alpha Pump",
    category: "Equipment",
    pricePerUnit: 120000,
    quantityAvailable: 5,
    images: [
      {
        url: "/images/product-placeholder.webp",
        cloudinary_id: "alpha-image",
        isDefault: true,
      },
    ],
    status: "approved",
    createdBy: { _id: sessionUser._id },
    createdAt: "2026-03-10T00:00:00.000Z",
    updatedAt: "2026-03-10T00:00:00.000Z",
  };

  const pendingProduct = {
    _id: "prod-pending",
    name: "Beta Kit",
    category: "Consumables",
    pricePerUnit: 45000,
    quantityAvailable: 11,
    images: [
      {
        url: "/images/product-placeholder.webp",
        cloudinary_id: "beta-image",
        isDefault: true,
      },
    ],
    status: "pending",
    createdBy: { _id: sessionUser._id },
    createdAt: "2026-03-11T00:00:00.000Z",
    updatedAt: "2026-03-11T00:00:00.000Z",
  };

  const draftProduct = {
    _id: "prod-draft",
    name: "Hidden Draft",
    category: "Equipment",
    pricePerUnit: 999,
    quantityAvailable: 1,
    images: [
      {
        url: "/images/product-placeholder.webp",
        cloudinary_id: "draft-image",
        isDefault: true,
      },
    ],
    status: "draft",
    createdBy: { _id: sessionUser._id },
    createdAt: "2026-03-12T00:00:00.000Z",
    updatedAt: "2026-03-12T00:00:00.000Z",
  };

  await page.route(`${API_BASE_URL}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (url.pathname === "/api/v1/auth/profile" && request.method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("Profile fetched successfully", {
            ...sessionUser,
            tokens: undefined,
          }),
        ),
      });
      return;
    }

    if (url.pathname === "/api/v1/categories" && request.method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok(
            "Categories fetched successfully",
            buildPaginated([
              {
                _id: "cat-equipment",
                name: "Equipment",
                description: "Equipment",
              },
              {
                _id: "cat-consumables",
                name: "Consumables",
                description: "Consumables",
              },
            ]),
          ),
        ),
      });
      return;
    }

    if (url.pathname === "/api/v1/products" && request.method() === "GET") {
      const query = Object.fromEntries(url.searchParams.entries());
      productQueries.push(query);

      if (url.searchParams.get("includeSummary") === "true") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(
            ok("Products fetched successfully", {
              ...buildPaginated([], 1, 6, 1),
              summary: {
                statusCounts: {
                  draft: 4,
                  pending: 2,
                  approved: 3,
                  rejected: 1,
                },
              },
            }),
          ),
        });
        return;
      }

      const pageNumber = Number(url.searchParams.get("page") || "1");
      const activeStatus = url.searchParams.get("status");
      const search = url.searchParams.get("search");
      const docs =
        search === "Alpha" || activeStatus === "approved"
          ? [approvedProduct]
          : [approvedProduct, pendingProduct, draftProduct];
      const totalPages = search === "Alpha" || activeStatus === "approved" ? 1 : 3;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok(
            "Products fetched successfully",
            buildPaginated(docs, pageNumber, docs.length, totalPages),
          ),
        ),
      });
      return;
    }

    await route.continue();
  });

  await page.goto("/dashboard/distributor/catalogue");

  await expect(page.getByRole("heading", { name: "Product Listings" })).toBeVisible();
  await expect(page.locator("table")).toBeVisible();
  await expect(page.getByText("Alpha Pump", { exact: true })).toBeVisible();
  await expect(page.getByText("Beta Kit", { exact: true })).toBeVisible();
  await expect(page.getByText("Hidden Draft", { exact: true })).not.toBeVisible();
  await expect(page.getByText("6", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Approved verification: 3", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Not approved verification: 3", { exact: true }),
  ).toBeVisible();

  await expect
    .poll(() => productQueries.length, { message: "initial summary and table queries" })
    .toBe(2);

  const initialSummaryQuery = productQueries.find(
    (query) => query.includeSummary === "true",
  );
  const initialTableQuery = productQueries.find(
    (query) => query.includeSummary !== "true",
  );

  expect(initialSummaryQuery).toMatchObject({
    statuses: "pending,approved,rejected",
    includeSummary: "true",
    page: "1",
    limit: "1",
  });
  expect(initialTableQuery).toMatchObject({
    statuses: "pending,approved,rejected",
    page: "1",
    limit: "10",
  });
  expect(initialTableQuery).not.toHaveProperty("status");

  await page.getByRole("button", { name: "Next", exact: true }).click();

  await expect
    .poll(() => productQueries[productQueries.length - 1]?.page)
    .toBe("2");

  const productSearchInput = page.getByPlaceholder("Enter product name");
  await productSearchInput.fill("Alpha");
  await productSearchInput.press("Enter");

  await expect
    .poll(() => productQueries[productQueries.length - 1])
    .toMatchObject({
      search: "Alpha",
      statuses: "pending,approved,rejected",
      page: "1",
      limit: "10",
    });

  await expect(page.getByText("Alpha Pump", { exact: true })).toBeVisible();
  await expect(page.getByText("Beta Kit", { exact: true })).not.toBeVisible();
  await expect(page.getByText("Hidden Draft", { exact: true })).not.toBeVisible();

  await page.getByRole("combobox").nth(0).click();
  await page.getByRole("option", { name: "Approved" }).click();
  await page.getByRole("button", { name: "Filter", exact: true }).click();

  await expect
    .poll(() => productQueries[productQueries.length - 1])
    .toMatchObject({
      search: "Alpha",
      status: "approved",
      page: "1",
      limit: "10",
    });

  expect(productQueries[productQueries.length - 1]).not.toHaveProperty("statuses");
});
