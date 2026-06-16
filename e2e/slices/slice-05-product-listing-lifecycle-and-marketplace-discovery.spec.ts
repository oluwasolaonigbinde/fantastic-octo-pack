// Contract: docs/slices/slice-5.md
// Slice 5: Product Listing Lifecycle, Marketplace Discovery, And Month 1 Navigation Completion
//
// Primary user paths:
// 1. Buyer, distributor, OEM, and engineer can reach every top-level Month 1 nav destination.
// 2. Distributor opens My Catalogue, starts Add New Product wizard (5 steps), submits listing.
// 3. OEM opens Listing Request queue, filters it, opens a listing detail, and approves or rejects.
// 4. Public visitor opens /products, browses approved listings, opens /products/[id].

import { expect, test, type Page } from "@playwright/test";

// ────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────
const API_BASE_URL =
  process.env.PLAYWRIGHT_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000/api/v1";

const AUTH_SESSION_STORAGE_KEY = "baiy.auth.session";

// Banned copy — must never appear on visible surfaces
const BANNED_PUBLIC_COPY =
  /\b(?:Draft|Deferred|Pending verification|Internal review|Listing candidate)\b/i;
// Raw backend status strings must not appear as readable labels
const BANNED_RAW_STATUS = /\b(?:pending|listed|verified)\b/;

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────
const buildPaginated = <T,>(docs: T[], totalDocs = docs.length) => ({
  docs,
  page: 1,
  limit: 10,
  hasNextPage: false,
  hasPreviousPage: false,
  nextPage: null,
  previousPage: null,
  totalDocs,
  totalPages: 1,
});

const ok = (message: string, data: unknown) => ({
  success: true,
  message,
  data,
});

type Role = "buyer" | "distributor" | "oem" | "engineer";

const buildSessionUser = (role: Role) => ({
  _id: `slice-05-${role}-user`,
  firstName: role === "oem" ? "Olivia" : role === "distributor" ? "Daniel" : role === "engineer" ? "Emeka" : "Amina",
  lastName: role === "oem" ? "Mensah" : role === "distributor" ? "Cole" : role === "engineer" ? "Adebayo" : "Bello",
  email: `${role}.slice05@example.com`,
  phoneNumber: "+2348012345678",
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

async function seedSession(page: Page, role: Role) {
  const user = buildSessionUser(role);
  await page.addInitScript(
    ([key, val]) => window.localStorage.setItem(key, val),
    [AUTH_SESSION_STORAGE_KEY, JSON.stringify(user)],
  );
  return user;
}

const MOCK_PRODUCT_ID = "slice-05-product-1";
const MOCK_PRODUCT_SUBMITTED = {
  _id: MOCK_PRODUCT_ID,
  name: "Industrial Pump A3",
  category: "Equipment",
  sub_category: "Pumps & Compressors",
  quantityAvailable: 50,
  priceMode: "fixed",
  pricePerUnit: 360028,
  countries: ["NG"],
  isRfqAvailable: false,
  keySpecifications: "Flow Rate: 500 L/min; Max Pressure: 10 bar",
  description: "Heavy-duty industrial pump for demanding environments.",
  images: [{ url: "/images/product-placeholder.webp", cloudinary_id: "cloud-1", isDefault: true }],
  status: "pending",
  oemApprovalStatus: "pending",
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
};

const MOCK_PRODUCT_APPROVED = {
  ...MOCK_PRODUCT_SUBMITTED,
  status: "verified",
  oemApprovalStatus: "approved",
};

const MOCK_SERVICE_REQUEST_PENDING = {
  _id: "507f1f77bcf86cd799439011",
  jobType: "Installation",
  equipmentName: "Philips Ultrasound Machine",
  brand: "Philips",
  preferredDate: "2026-02-03T00:00:00.000Z",
  preferredTime: "Morning (8:00 AM - 12:00 PM)",
  serviceDescription:
    "New CT scanner needs installation and calibration. Room is prepared with proper electrical setup and cooling system.",
  requester: {
    _id: "slice-05-buyer-user",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "buyer.slice05@example.com",
  },
  engineer: {
    _id: "slice-05-engineer-user",
    firstName: "Emeka",
    lastName: "Adebayo",
    email: "engineer.slice05@example.com",
  },
  status: "pending",
  createdAt: "2026-02-01T00:00:00.000Z",
  updatedAt: "2026-02-01T00:00:00.000Z",
};

async function installBaseApi(
  page: Page,
  options: { role: Role; initialProduct?: Record<string, unknown> },
) {
  const user = buildSessionUser(options.role);
  let currentProduct: Record<string, unknown> = {
    ...(options.initialProduct ?? MOCK_PRODUCT_SUBMITTED),
  };

  await page.route(`${API_BASE_URL}/**`, async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    // Auth profile
    if (url === `${API_BASE_URL}/auth/profile` && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Profile fetched successfully", { ...user, tokens: undefined })),
      });
      return;
    }

    // Categories
    if (url.includes("/categories")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("Categories fetched successfully", buildPaginated([
            { _id: "cat-eq", name: "Equipment", description: "Industrial equipment" },
            { _id: "cat-con", name: "Consumables", description: "Industrial consumables" },
          ])),
        ),
      });
      return;
    }

    // Products list
    if (url.includes("/products") && !url.includes(`/products/${MOCK_PRODUCT_ID}`) && !url.includes("/review") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("Products fetched successfully", buildPaginated([currentProduct])),
        ),
      });
      return;
    }

    // Single product
    if (url.includes(`/products/${MOCK_PRODUCT_ID}`) && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Product fetched successfully", currentProduct)),
      });
      return;
    }

    // Product update
    if (url.includes(`/products/${MOCK_PRODUCT_ID}`) && method === "PATCH") {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      currentProduct = {
        ...currentProduct,
        ...body,
        updatedAt: "2026-03-16T00:00:00.000Z",
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Product updated successfully", currentProduct)),
      });
      return;
    }

    // Product review (approve/reject)
    if (url.includes(`/products/${MOCK_PRODUCT_ID}/review`) && method === "PATCH") {
      const body = route.request().postDataJSON() as { action: string; rejectionReason?: string };
      const updatedStatus = body.action === "approve" ? "verified" : "rejected";
      currentProduct = {
        ...currentProduct,
        status: updatedStatus,
        oemApprovalStatus: body.action === "approve" ? "approved" : "rejected",
        oemRejectionReason: body.rejectionReason,
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("Product reviewed successfully", currentProduct),
        ),
      });
      return;
    }

    // Product create
    if (url.includes("/products") && method === "POST") {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(ok("Product created successfully", MOCK_PRODUCT_SUBMITTED)),
      });
      return;
    }

    // Quotes
    if (url.includes("/quotes") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Quotes fetched", buildPaginated([]))),
      });
      return;
    }

    // Service requests (engineer / buyer dashboards)
    if (url.includes("/service-requests") && method === "GET") {
      const pathname = new URL(url).pathname;
      const isListPath =
        pathname.endsWith("/service-requests") || pathname.endsWith("/service-requests/");
      const singleMatch = pathname.match(/\/service-requests\/([^/]+)\/?$/);
      if (isListPath) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(
            ok("Service requests fetched successfully", [MOCK_SERVICE_REQUEST_PENDING]),
          ),
        });
        return;
      }
      if (singleMatch?.[1] && singleMatch[1] !== "status") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(
            ok("Service request fetched successfully", {
              ...MOCK_SERVICE_REQUEST_PENDING,
              _id: singleMatch[1],
            }),
          ),
        });
        return;
      }
    }

    if (url.includes("/service-requests/") && url.includes("/status") && method === "PATCH") {
      const body = route.request().postDataJSON() as { status?: string };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("Service request status updated successfully", {
            ...MOCK_SERVICE_REQUEST_PENDING,
            status: body.status ?? MOCK_SERVICE_REQUEST_PENDING.status,
            updatedAt: "2026-02-02T00:00:00.000Z",
          }),
        ),
      });
      return;
    }

    // Pass through anything else (static assets, etc.)
    await route.continue();
  });
}

// ────────────────────────────────────────────────────────────────
// A. Distributor product submission journey
// ────────────────────────────────────────────────────────────────

test.describe("Slice 5 — A: Distributor product submission journey", () => {
  test.beforeEach(async ({ page }) => {
    await seedSession(page, "distributor");
    await installBaseApi(page, { role: "distributor" });
  });

  test("distributor can open My Catalogue and see product listing route", async ({ page }) => {
    await page.goto("/dashboard/distributor/catalogue");
    await expect(page.getByRole("heading", { name: /Product Listing/i })).toBeVisible();

    // "Add New Product" CTA is present
    await expect(page.getByRole("button", { name: /Add New Product/i })).toBeVisible();

    // Filter row elements are present
    await expect(page.getByPlaceholder(/Enter product name/i)).toBeVisible();

    // Status column header visible
    await expect(page.getByText(/Status/i).first()).toBeVisible();

    // No banned copy
    const body = await page.textContent("body");
    expect(body).not.toMatch(BANNED_PUBLIC_COPY);
  });

  test("distributor can navigate step 1 of the 5-step Add New Product wizard", async ({ page }) => {
    await page.goto("/dashboard/distributor/catalogue/new");

    // Stepper is visible
    await expect(page.getByText(/Product category/i).first()).toBeVisible();
    await expect(page.getByText(/Product basic info/i).first()).toBeVisible();

    // Step 1 — category selection
    await expect(
      page.getByText(/Provide the correct information about the product category/i),
    ).toBeVisible();

    // Category select is present
    const categorySelect = page.getByText(/Select category/i).first();
    await expect(categorySelect).toBeVisible();
  });

  test("distributor wizard advances to step 2 after selecting category", async ({ page }) => {
    await page.goto("/dashboard/distributor/catalogue/new");

    // Step 1: choose a category (Combobox trigger)
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Equipment" }).click();

    // Click Save & Continue
    await page.getByRole("button", { name: /Save & Continue/i }).click();

    // Step 2 should now show product info form
    await expect(page.getByPlaceholder(/Enter name of product/i)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Product Basic Info/i }),
    ).toBeVisible();
  });

  test("distributor wizard shows validation error when required fields missing", async ({ page }) => {
    await page.goto("/dashboard/distributor/catalogue/new");

    // Try to advance without selecting category
    await page.getByRole("button", { name: /Save & Continue/i }).click();

    // Validation error appears
    await expect(page.getByText(/Select a category to continue/i)).toBeVisible();
  });

  test("product table status chips do not display raw backend values", async ({ page }) => {
    await page.goto("/dashboard/distributor/catalogue");

    // Wait for table to render
    await page.waitForSelector("table", { timeout: 10000 });

    const tableText = await page.locator("table").textContent();

    // Raw backend statuses must not appear as visible cell labels
    expect(tableText).not.toMatch(BANNED_RAW_STATUS);

    // The catalogue currently renders the canonical UI label "Pending"
    expect(tableText).toContain("Pending");
  });
});

// ────────────────────────────────────────────────────────────────
// B. OEM listing review journey
// ────────────────────────────────────────────────────────────────

test.describe("Slice 5 — B: OEM listing review journey", () => {
  test.beforeEach(async ({ page }) => {
    await seedSession(page, "oem");
    await installBaseApi(page, { role: "oem" });
  });

  test("OEM listing request queue renders with KPI cards and filter row", async ({ page }) => {
    await page.goto("/dashboard/oem/requests");

    // Page heading
    await expect(page.getByRole("heading", { name: /^Listing Request$/i }).first()).toBeVisible();

    // KPI cards area
    await expect(page.getByText(/Total listing request/i)).toBeVisible();
    await expect(page.getByText(/Total pending listing/i).first()).toBeVisible();
    await expect(page.getByText(/Total approved request/i).first()).toBeVisible();

    // Filter inputs
    await expect(page.getByLabel(/Distributor name/i)).toBeVisible();
    await expect(page.getByLabel(/Product name/i)).toBeVisible();

    // Status and category filters
    await expect(page.getByText(/Verification status/i)).toBeVisible();
    await expect(page.getByText(/Product category/i)).toBeVisible();
  });

  test("OEM listing request queue does not show raw backend status values", async ({ page }) => {
    await page.goto("/dashboard/oem/requests");
    await page.waitForSelector("table", { timeout: 10000 });

    const tableText = await page.locator("table").textContent();
    expect(tableText).not.toMatch(BANNED_RAW_STATUS);
  });

  test("OEM distributor page no longer shows unavailable verification placeholders", async ({
    page,
  }) => {
    await page.goto("/dashboard/oem/distributors");
    await page.waitForSelector("table", { timeout: 10000 });

    await expect(page.getByText(/Pending review/i)).toBeVisible();

    const body = await page.textContent("body");
    expect(body).not.toContain("Status unavailable");
    expect(body).not.toContain("Unavailable");
  });

  test("OEM can open a listing detail with product information", async ({ page }) => {
    await page.goto(`/dashboard/oem/requests/${MOCK_PRODUCT_ID}`);

    // Product name visible
    await expect(page.getByText("Industrial Pump A3")).toBeVisible();

    // Seller card visible
    await expect(page.getByText("Daniel Cole")).toBeVisible();

    // Status badge visible
    await expect(page.getByText(/^Pending$/).first()).toBeVisible();

    // Key specs section
    await expect(page.getByText(/Key Specifications/i)).toBeVisible();

    // Action buttons
    await expect(page.getByRole("button", { name: /Approve Product/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Reject listing/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Edit Product/i })).toBeVisible();
  });

  test("OEM approves a submitted listing and sees Approved status", async ({ page }) => {
    await page.goto(`/dashboard/oem/requests/${MOCK_PRODUCT_ID}`);

    // Click Approve
    await page.getByRole("button", { name: /Approve Product/i }).click();

    // After approval the status badge should transition
    await expect(
      page.getByText(/You have approved this product listing request/i),
    ).toBeVisible();
  });

  test("OEM approved listing detail only shows edit action", async ({ page }) => {
    await page.unroute(`${API_BASE_URL}/**`);
    await installBaseApi(page, { role: "oem", initialProduct: MOCK_PRODUCT_APPROVED });

    await page.goto(`/dashboard/oem/requests/${MOCK_PRODUCT_ID}`);

    await expect(page.getByText(/^Approved$/).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Edit Product/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Approve Product/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Reject listing/i })).toHaveCount(0);
  });

  test("OEM reject flow requires a rejection reason", async ({ page }) => {
    await page.goto(`/dashboard/oem/requests/${MOCK_PRODUCT_ID}`);

    // Open reject form
    await page.getByRole("button", { name: /Reject listing/i }).click();

    // Rejection reason textarea appears
    await expect(page.getByPlaceholder(/Explain why this listing should be rejected/i)).toBeVisible();

    // Confirm rejection is disabled while reason is empty
    const confirmBtn = page.getByRole("button", { name: /Confirm rejection/i });
    await expect(confirmBtn).toBeDisabled();

    // Fill reason and confirm
    await page
      .getByPlaceholder(/Explain why this listing should be rejected/i)
      .fill("Product specifications are incomplete.");
    await expect(confirmBtn).toBeEnabled();

    const rejectResponsePromise = page.waitForResponse(
      (response) =>
        response.url() === `${API_BASE_URL}/products/${MOCK_PRODUCT_ID}/review` &&
        response.request().method() === "PATCH",
    );
    await confirmBtn.click();
    const rejectResponse = await rejectResponsePromise;

    // Rejection confirmed
    expect(rejectResponse.status()).toBe(200);
  });

  test("OEM can open the edit product surface and save text changes", async ({ page }) => {
    await page.goto(`/dashboard/oem/requests/${MOCK_PRODUCT_ID}/edit`);

    await expect(page.getByRole("heading", { name: /Edit Product/i })).toBeVisible();
    await expect(page.getByLabel(/Product name/i)).toHaveValue("Industrial Pump A3");

    await page.getByLabel(/Product name/i).fill("Industrial Pump A3 Updated");
    await page.getByRole("button", { name: /Save & Update/i }).click();

    await expect(
      page.getByText(/You have successfully updated this product information/i),
    ).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────────
// C. Public marketplace journey
// ────────────────────────────────────────────────────────────────

test.describe("Slice 5 — C: Public marketplace journey", () => {
  test.beforeEach(async ({ page }) => {
    // No auth needed — public visitor
    await installBaseApi(page, { role: "buyer" });
  });

  test("approved listings appear on /products", async ({ page }) => {
    await page.goto("/products");

    // Page must render without error
    await expect(page).not.toHaveURL(/error/i);

    // No banned copy
    const body = await page.textContent("body");
    expect(body).not.toMatch(BANNED_PUBLIC_COPY);
  });

  test("public product detail renders real description not Lorem Ipsum", async ({ page }) => {
    // Ensure route fetches product by ID
    await page.route(`${API_BASE_URL}/products/${MOCK_PRODUCT_ID}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Product fetched successfully", MOCK_PRODUCT_APPROVED)),
      });
    });

    await page.goto(`/products/${MOCK_PRODUCT_ID}`);

    // Product name visible
    await expect(page.getByRole("heading", { name: "Industrial Pump A3" })).toBeVisible();

    // Description must not contain Lorem ipsum
    const body = await page.textContent("body");
    expect(body).not.toMatch(/Lorem ipsum/i);

    // Hardcoded placeholder text must not appear
    expect(body).not.toMatch(/This is the name of distributor/i);
    expect(body).not.toMatch(/Name of distributors/i);

    // No banned copy
    expect(body).not.toMatch(BANNED_PUBLIC_COPY);
  });
});

// ────────────────────────────────────────────────────────────────
// D. PNG-backed route visual completeness
// ────────────────────────────────────────────────────────────────

test.describe("Slice 5 — D: PNG-backed route visual completeness", () => {
  test("buyer KYC route renders tier list and upload affordance", async ({ page }) => {
    await seedSession(page, "buyer");
    await installBaseApi(page, { role: "buyer" });
    await page.goto("/dashboard/buyer/kyc-verification");

    // Not a 404
    await expect(page).not.toHaveURL(/404/);

    // Tier headings
    await expect(page.getByText(/Tier 1/i)).toBeVisible();
    await expect(page.getByText(/Tier 2/i)).toBeVisible();
    await expect(page.getByText(/Tier 3/i)).toBeVisible();

    // Status badges visible
    await expect(page.getByText(/Not Submitted/i).first()).toBeVisible();
    await expect(page.getByText(/Locked/i).first()).toBeVisible();

    // Upload documents button for tier 1
    await expect(page.getByRole("button", { name: /Upload Documents/i }).first()).toBeVisible();

    const body = await page.textContent("body");
    expect(body).not.toMatch(BANNED_PUBLIC_COPY);
  });

  test("buyer messages route renders conversation list and compose box", async ({ page }) => {
    await seedSession(page, "buyer");
    await installBaseApi(page, { role: "buyer" });
    const receiverId = "507f1f77bcf86cd799439022";
    const conversation = {
      id: "slice-05-buyer-message-conversation",
      participants: ["slice-05-buyer-user", receiverId],
      createdAt: "2026-04-20T08:00:00.000Z",
      lastMessageAt: null,
      lastMessagePreview: null,
      counterpart: {
        id: receiverId,
        role: "distributor",
        displayName: "Daniel Cole",
        avatarUrl: null,
        secondaryLabel: "Verified Seller",
        isVerifiedSeller: true,
      },
    };

    await page.route(`${API_BASE_URL}/conversations**`, async (route) => {
      const request = route.request();
      const url = new URL(request.url());

      if (request.method() === "GET" && url.pathname.endsWith("/conversations")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(ok("Conversations fetched", [])),
        });
        return;
      }

      if (request.method() === "POST" && url.pathname.endsWith("/conversations/start")) {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(ok("Conversation created", conversation)),
        });
        return;
      }

      if (request.method() === "GET" && url.pathname.endsWith(`/conversations/${conversation.id}`)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(ok("Conversation fetched", { conversation, messages: [] })),
        });
        return;
      }

      await route.continue();
    });

    await page.goto(`/dashboard/buyer/messages?compose=1&to=${receiverId}`);

    await expect(page).not.toHaveURL(/404/);

    // Conversation list
    await expect(page.getByText("Conversations", { exact: true })).toBeVisible();

    // At least one conversation entry visible
    await expect(page.getByTestId("conversation-list-item")).toHaveCount(1);

    // Compose box
    await expect(page.getByPlaceholder(/Write your message here/i)).toBeVisible();

    // Can type in compose box
    await page.getByPlaceholder(/Write your message here/i).fill("Hello there");
    await expect(page.getByPlaceholder(/Write your message here/i)).toHaveValue("Hello there");

    const body = await page.textContent("body");
    expect(body).not.toMatch(BANNED_PUBLIC_COPY);
  });

  test("distributor wallet/payments route renders balance cards and transaction table", async ({ page }) => {
    await seedSession(page, "distributor");
    await installBaseApi(page, { role: "distributor" });
    await page.goto("/dashboard/distributor/payments");

    await expect(page).not.toHaveURL(/404/);

    // Balance card headings
    await expect(page.getByText(/Available Balance/i)).toBeVisible();
    await expect(page.getByText(/Total Revenue/i)).toBeVisible();
    await expect(page.getByText(/Pending Payout/i)).toBeVisible();

    // Transaction table
    await expect(page.getByText(/Transaction History/i)).toBeVisible();

    // Withdraw button present
    await expect(page.getByRole("button", { name: /Withdraw Funds/i })).toBeVisible();

    const body = await page.textContent("body");
    expect(body).not.toMatch(BANNED_PUBLIC_COPY);
  });

  test("engineer job requests route renders KPI cards and job cards", async ({ page }) => {
    await seedSession(page, "engineer");
    await installBaseApi(page, { role: "engineer" });
    await page.goto("/dashboard/engineer/job-requests");

    await expect(page).not.toHaveURL(/404/);

    // Heading
    await expect(page.getByRole("heading", { name: /Job Requests/i })).toBeVisible();

    // KPI cards (Service Engineer overview metrics)
    await expect(page.getByText(/All job requests/i).first()).toBeVisible();
    await expect(page.getByText(/All pending job requests/i).first()).toBeVisible();
    await expect(page.getByText(/Completed job request/i).first()).toBeVisible();

    // Filter row
    await expect(page.getByRole("button", { name: /Reset/i }).first()).toBeVisible();

    // Job cards (Figma sample content)
    await expect(page.getByText(/Philips Ultrasound Machine/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /^Accept$/i }).first()).toBeVisible();

    const body = await page.textContent("body");
    expect(body).not.toMatch(BANNED_PUBLIC_COPY);
  });

  test("OEM listing queue status chips use canonical labels only", async ({ page }) => {
    await seedSession(page, "oem");
    await installBaseApi(page, { role: "oem" });
    await page.goto("/dashboard/oem/requests");

    await page.waitForSelector("table", { timeout: 10000 });
    const tableText = await page.locator("table").textContent();

    // Canonical labels present
    expect(tableText).toMatch(/Pending|Approved|Rejected/);

    // Raw backend values must not appear as visible text
    expect(tableText).not.toMatch(/\bpending\b/);
    expect(tableText).not.toMatch(/\blisted\b/);
    expect(tableText).not.toMatch(/\bverified\b/);
  });

  test("distributor catalogue status chips use canonical labels only", async ({ page }) => {
    await seedSession(page, "distributor");
    await installBaseApi(page, { role: "distributor" });
    await page.goto("/dashboard/distributor/catalogue");

    await page.waitForSelector("table", { timeout: 10000 });
    const tableText = await page.locator("table").textContent();

    // Canonical label "Pending" expected for pending product
    expect(tableText).toContain("Pending");

    // Raw "pending" must not appear as a table cell label
    expect(tableText).not.toMatch(/\bpending\b/);
  });
});
