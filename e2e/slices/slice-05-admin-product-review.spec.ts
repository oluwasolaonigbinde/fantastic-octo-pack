import { expect, test, type Page } from "@playwright/test";

const API_BASE_URL =
  process.env.PLAYWRIGHT_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000/api/v1";

const AUTH_SESSION_STORAGE_KEY = "baiy.auth.session";

type Role = "admin" | "distributor";
type ProductStatus = "draft" | "pending" | "approved" | "rejected";

interface MockProduct {
  _id: string;
  name: string;
  category: string;
  sub_category?: string;
  quantityAvailable: number;
  priceMode: "fixed";
  pricePerUnit: number;
  countries: string[];
  isRfqAvailable: boolean;
  keySpecifications: string;
  description: string;
  images: Array<{ url: string; cloudinary_id: string; isDefault: boolean }>;
  status: ProductStatus;
  visibilityRejectionReason?: string;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: "distributor";
    isEmailVerified: true;
  };
  createdAt: string;
  updatedAt: string;
  submittedAt: string;
}

const buildPaginated = <T,>(
  docs: T[],
  options: { page?: number; limit?: number; totalDocs?: number } = {}
) => {
  const page = options.page ?? 1;
  const limit = options.limit ?? 10;
  const totalDocs = options.totalDocs ?? docs.length;
  const totalPages = Math.max(1, Math.ceil(totalDocs / limit));

  return {
    docs,
    page,
    limit,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    nextPage: page < totalPages ? page + 1 : null,
    previousPage: page > 1 ? page - 1 : null,
    totalDocs,
    totalPages,
  };
};

const ok = (message: string, data: unknown) => ({
  success: true,
  message,
  data,
});

const buildSessionUser = (role: Role) => ({
  _id: `slice-05-${role}-user`,
  firstName: role === "admin" ? "Ada" : "Daniel",
  lastName: role === "admin" ? "Admin" : "Cole",
  email: `${role}.slice05@example.com`,
  phoneNumber: "+2348012345678",
  address: "12 Admin Review Avenue",
  role,
  status: "active",
  isEmailVerified: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  tokens: {
    accessToken: `slice-05-${role}-access-token`,
    refreshToken: `slice-05-${role}-refresh-token`,
  },
});

const buildProduct = (
  status: ProductStatus,
  suffix: string,
  overrides: Partial<MockProduct> = {}
): MockProduct => ({
  _id: `slice-05-admin-product-${suffix}`,
  name:
    suffix === "pending"
      ? "Industrial Pump A3"
      : suffix === "approved"
        ? "Cardiac Monitor X2"
        : suffix === "rejected"
          ? "Surgical Light M5"
          : "Hidden Draft Product",
  category: "Equipment",
  sub_category: "Medical Imaging",
  quantityAvailable: 25,
  priceMode: "fixed",
  pricePerUnit: 175000,
  countries: ["NG"],
  isRfqAvailable: false,
  keySpecifications: "Brand: MedEquip; Power Supply: 240V; Warranty: 24 months",
  description: "A reviewable industrial-grade medical device listing.",
  images: [
    {
      url: "/images/product 2.webp",
      cloudinary_id: `cloud-${suffix}`,
      isDefault: true,
    },
  ],
  status,
  visibilityRejectionReason:
    status === "rejected" ? "Certification documents were incomplete." : undefined,
  createdBy: {
    _id: "slice-05-distributor-user",
    firstName: "Daniel",
    lastName: "Cole",
    email: "distributor.slice05@example.com",
    role: "distributor",
    isEmailVerified: true,
  },
  createdAt: "2026-03-15T00:00:00.000Z",
  updatedAt: "2026-03-15T00:00:00.000Z",
  submittedAt: "2026-03-16T10:25:00.000Z",
  ...overrides,
});

async function seedSession(page: Page, role: Role) {
  const user = buildSessionUser(role);
  await page.addInitScript(
    ([key, val]) => window.localStorage.setItem(key, val),
    [AUTH_SESSION_STORAGE_KEY, JSON.stringify(user)]
  );
}

async function clearSession(page: Page) {
  await page.evaluate((key) => window.localStorage.removeItem(key), AUTH_SESSION_STORAGE_KEY);
}

async function installAdminReviewApi(
  page: Page,
  state: { products: MockProduct[]; role: Role }
) {
  const currentUser = buildSessionUser(state.role);

  await page.route(`${API_BASE_URL}/**`, async (route) => {
    const requestUrl = new URL(route.request().url());
    const method = route.request().method();
    const pathname = requestUrl.pathname;
    const authorization = route.request().headers()["authorization"];
    const hasAuth = Boolean(authorization);

    if (pathname.endsWith("/auth/profile") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("Profile fetched successfully", { ...currentUser, tokens: undefined })
        ),
      });
      return;
    }

    if (pathname.endsWith("/categories") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok(
            "Categories fetched successfully",
            buildPaginated([
              { _id: "cat-equipment", name: "Equipment", description: "Equipment" },
              { _id: "cat-consumables", name: "Consumables", description: "Consumables" },
            ])
          )
        ),
      });
      return;
    }

    if (pathname.endsWith("/products") && method === "GET") {
      let docs = [...state.products];

      if (!hasAuth) {
        docs = docs.filter((product) => product.status === "approved");
      } else if (authorization?.includes("admin")) {
        docs = docs.filter((product) => product.status !== "draft");
      } else {
        docs = docs.filter((product) => product.createdBy._id === "slice-05-distributor-user");
      }

      const status = requestUrl.searchParams.get("status");
      if (status) {
        docs = docs.filter((product) => product.status === status);
      }

      const search = requestUrl.searchParams.get("search")?.trim().toLowerCase();
      if (search) {
        docs = docs.filter((product) => product.name.toLowerCase().includes(search));
      }

      const category = requestUrl.searchParams.get("category");
      if (category) {
        docs = docs.filter((product) => product.category === category);
      }

      const submittedFrom = requestUrl.searchParams.get("submittedFrom");
      if (submittedFrom) {
        const fromTime = new Date(`${submittedFrom}T00:00:00.000Z`).getTime();
        docs = docs.filter((product) => {
          const listingTime = new Date(product.submittedAt || product.createdAt).getTime();
          return listingTime >= fromTime;
        });
      }

      const submittedTo = requestUrl.searchParams.get("submittedTo");
      if (submittedTo) {
        const toTime = new Date(`${submittedTo}T23:59:59.999Z`).getTime();
        docs = docs.filter((product) => {
          const listingTime = new Date(product.submittedAt || product.createdAt).getTime();
          return listingTime <= toTime;
        });
      }

      const limit = Math.max(1, Number(requestUrl.searchParams.get("limit") ?? "10") || 10);
      const page = Math.max(1, Number(requestUrl.searchParams.get("page") ?? "1") || 1);
      const totalDocs = docs.length;
      const paginatedDocs = docs.slice((page - 1) * limit, page * limit);

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok(
            "Products fetched successfully",
            buildPaginated(paginatedDocs, { page, limit, totalDocs })
          )
        ),
      });
      return;
    }

    if (pathname.includes("/products/") && method === "GET") {
      const productId = pathname.split("/products/")[1]?.split("/")[0];
      const product = state.products.find((entry) => entry._id === productId);

      if (!product || (!hasAuth && product.status !== "approved")) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            message: "Product not found",
            data: null,
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Product fetched successfully", product)),
      });
      return;
    }

    if (pathname.includes("/visibility") && method === "PATCH") {
      const productId = pathname.split("/products/")[1]?.split("/")[0];
      const product = state.products.find((entry) => entry._id === productId);
      const payload = route.request().postDataJSON() as {
        action: "approve" | "reject";
        rejectionReason?: string;
      };

      if (!product) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            message: "Product not found",
            data: null,
          }),
        });
        return;
      }

      if (payload.action === "reject" && !payload.rejectionReason?.trim()) {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            message: "A rejection reason is required when rejecting visibility",
            data: null,
          }),
        });
        return;
      }

      product.status = payload.action === "approve" ? "approved" : "rejected";
      product.visibilityRejectionReason =
        payload.action === "reject" ? payload.rejectionReason?.trim() : undefined;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok(
            payload.action === "approve"
              ? "Product visibility approved"
              : "Product visibility rejected",
            product
          )
        ),
      });
      return;
    }

    await route.continue();
  });
}

test.describe("Slice 5 admin product review", () => {
  test("admin dashboard overview renders and links to the products queue", async ({ page }) => {
    const state = {
      role: "admin" as const,
      products: [
        buildProduct("pending", "pending"),
        buildProduct("approved", "approved"),
        buildProduct("rejected", "rejected"),
      ],
    };

    await seedSession(page, "admin");
    await installAdminReviewApi(page, state);

    await page.goto("/dashboard/admin");

    await expect(page.getByRole("heading", { name: /Admin Dashboard/i })).toBeVisible();
    await expect(page.getByText(/Total approved/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /View All Users/i })).toBeDisabled();

    await page.getByRole("button", { name: /View All Product/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/products$/);
  });

  test("admin products list shows pending, approved, and rejected listings but hides drafts", async ({
    page,
  }) => {
    const state = {
      role: "admin" as const,
      products: [
        buildProduct("pending", "pending"),
        buildProduct("approved", "approved"),
        buildProduct("rejected", "rejected"),
        buildProduct("draft", "draft"),
      ],
    };

    await seedSession(page, "admin");
    await installAdminReviewApi(page, state);

    await page.goto("/dashboard/admin/products");

    await expect(page.getByText(/All Listed Products/i)).toBeVisible();
    await expect(page.getByText("Industrial Pump A3")).toBeVisible();
    await expect(page.getByText("Cardiac Monitor X2")).toBeVisible();
    await expect(page.getByText("Surgical Light M5")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Hidden Draft Product");
  });

  test("admin filters apply only on request, preserve pagination, and keep status text-only", async ({
    page,
  }) => {
    const filteredProducts = Array.from({ length: 11 }, (_, index) =>
      buildProduct("approved", `approved-filter-${index + 1}`, {
        name: `Approved Filter Product ${index + 1}`,
        submittedAt: `2026-03-${String(index + 1).padStart(2, "0")}T10:25:00.000Z`,
      })
    );

    const state = {
      role: "admin" as const,
      products: [
        buildProduct("pending", "pending-filter", {
          name: "Pending Calibration Unit",
        }),
        buildProduct("approved", "approved-consumable-filter", {
          name: "Approved Consumable Product",
          category: "Consumables",
        }),
        ...filteredProducts,
      ],
    };

    await seedSession(page, "admin");
    await installAdminReviewApi(page, state);

    await page.goto("/dashboard/admin/products");

    await page.getByPlaceholder("Enter product name").fill("Approved Filter");
    await page.getByRole("combobox").nth(0).click();
    await page.getByRole("option", { name: "Equipment" }).click();
    await page.getByRole("combobox").nth(1).click();
    await page.getByRole("option", { name: "Approved" }).click();

    await expect(page.getByText("Pending Calibration Unit")).toBeVisible();
    await expect(page.getByText("Approved Consumable Product")).toBeVisible();

    await page.getByRole("button", { name: "Filter" }).click();

    await expect(page.getByText("Pending Calibration Unit")).not.toBeVisible();
    await expect(page.getByText("Approved Consumable Product")).not.toBeVisible();
    await expect(
      page.getByText("Approved Filter Product 1", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText("Approved Filter Product 11", { exact: true })
    ).not.toBeVisible();

    const approvedStatus = page
      .locator("tbody tr")
      .filter({ hasText: "Approved Filter Product 1" })
      .locator("td")
      .nth(7)
      .locator("span");
    const approvedStatusClassName = (await approvedStatus.getAttribute("class")) ?? "";

    expect(approvedStatusClassName).toContain("text-success");
    expect(approvedStatusClassName).not.toContain("rounded-full");
    expect(approvedStatusClassName).not.toContain("bg-");

    await page.getByRole("button", { name: "Next", exact: true }).click();

    await expect(
      page.getByText("Approved Filter Product 11", { exact: true })
    ).toBeVisible();
    await expect(page.getByText("Pending Calibration Unit")).not.toBeVisible();
    await expect(page.getByText("Approved Consumable Product")).not.toBeVisible();
  });

  test("admin can approve a pending product and it becomes visible on public routes", async ({
    page,
  }) => {
    const state = {
      role: "admin" as const,
      products: [buildProduct("pending", "pending")],
    };

    await seedSession(page, "admin");
    await installAdminReviewApi(page, state);

    await page.goto("/dashboard/admin/products/slice-05-admin-product-pending");

    await expect(page.getByText(/Current listing status/i)).toBeVisible();
    await page.getByRole("button", { name: /Approve Listing/i }).click();

    await expect(
      page.getByText(/This listing has been approved and is now visible/i)
    ).toBeVisible();

    await clearSession(page);
    await page.goto("/products");
    await expect(page.getByText("Industrial Pump A3")).toBeVisible();

    await page.goto("/products/slice-05-admin-product-pending");
    await expect(page.getByRole("heading", { name: "Industrial Pump A3" })).toBeVisible();
  });

  test("admin reject flow requires a reason and keeps the product hidden publicly", async ({
    page,
  }) => {
    const state = {
      role: "admin" as const,
      products: [buildProduct("pending", "pending")],
    };

    await seedSession(page, "admin");
    await installAdminReviewApi(page, state);

    await page.goto("/dashboard/admin/products/slice-05-admin-product-pending");

    await page.getByRole("button", { name: /Reject Listing/i }).click();
    const confirmButton = page.getByRole("button", { name: /Confirm Rejection/i });
    await expect(confirmButton).toBeDisabled();

    await page
      .getByPlaceholder(/Explain why this listing should remain hidden/i)
      .fill("Certification documents were incomplete.");
    await expect(confirmButton).toBeEnabled();
    await confirmButton.click();

    await expect(
      page.getByText(/This listing has been rejected and remains hidden/i)
    ).toBeVisible();

    await clearSession(page);
    await page.goto("/products");
    await expect(page.locator("body")).not.toContainText("Industrial Pump A3");
  });
});
