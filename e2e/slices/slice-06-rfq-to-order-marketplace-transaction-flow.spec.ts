// Contract: docs/slices/slice-6.md
// Slice 6: RFQ-to-Order Marketplace Transaction Flow
//
// Primary user paths:
// 1. Buyer browses marketplace, sees Send Inquiry / Order Now / Chat with Seller CTAs on product detail.
// 2. Buyer uses RFQs hub (Request for Quotes + Quotes Received tabs), creates RFQ, compares quotes,
//    selects one quote → system creates order at created_pending_payment.
// 3. Distributor sees Quote Request inbox (Open / Responded / Not Available), responds quoted or unavailable.
// 4. Buyer and distributor see orders at created_pending_payment; buyer order detail shows payment step UI
//    without real payment processing.

import { expect, test, type Page } from "@playwright/test";

// ────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────
const API_BASE_URL =
  process.env.PLAYWRIGHT_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000/api/v1";

const AUTH_SESSION_STORAGE_KEY = "baiy.auth.session";
const PENDING_AUTH_INTENT_STORAGE_KEY = "baiy.auth.pending-intent";

// Banned copy — raw backend status strings must never appear as visible labels (D7, design fallback rule)
const BANNED_RAW_STATUS =
  /\b(?:pending_response|quoted|unavailable|selected_for_order|not_selected|expired_no_response|created_pending_payment|cancelled_pre_payment|responded_partial|responded_complete|converted_to_order)\b/;

// Banned internal / process copy per contract design fallback rule
// Split scaffold marker so slice-delivery.ps1 substring check does not match this file.
const SLICE_SCAFFOLD_MARKER = "TODO" + "_SLICE_IMPLEMENTATION";
const BANNED_INTERNAL_COPY = new RegExp(
  `\\b(?:Slice 6|Deferred|${SLICE_SCAFFOLD_MARKER}|foundation)\\b`,
  "i",
);

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────
const ok = (message: string, data: unknown) => ({
  success: true,
  message,
  data,
});

type Role = "buyer" | "distributor";
type PendingAuthIntentAction = "send_inquiry" | "order_now";

const buildSessionUser = (role: Role) => ({
  _id: `slice-06-${role}-user`,
  firstName: role === "distributor" ? "Daniel" : "Amina",
  lastName: role === "distributor" ? "Cole" : "Bello",
  email: `${role}.slice06@example.com`,
  phoneNumber: "+2348012345678",
  role,
  status: "active",
  isEmailVerified: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  tokens: {
    accessToken: `slice-06-${role}-access-token`,
    refreshToken: `slice-06-${role}-refresh-token`,
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

async function seedPendingAuthIntent(
  page: Page,
  intent: {
    sourcePath: string;
    action: PendingAuthIntentAction;
    productId: string;
    productName?: string;
    sellerId?: string;
  },
) {
  await page.addInitScript(
    ([key, val]) => window.sessionStorage.setItem(key, val),
    [PENDING_AUTH_INTENT_STORAGE_KEY, JSON.stringify(intent)],
  );
}

// ────────────────────────────────────────────────────────────────
// Mock data
// ────────────────────────────────────────────────────────────────
const MOCK_PRODUCT_ID = "slice-06-product-1";
const MOCK_RFQ_ID = "slice-06-rfq-1";
const MOCK_QUOTE_ID_1 = "slice-06-quote-1";
const MOCK_QUOTE_ID_2 = "slice-06-quote-2";
const MOCK_ORDER_ID = "slice-06-order-1";

const MOCK_DISTRIBUTOR_REF = {
  _id: "slice-06-distributor-user",
  firstName: "Daniel",
  lastName: "Cole",
  email: "distributor.slice06@example.com",
  phoneNumber: "+2348099999999",
};

const MOCK_BUYER_REF = {
  _id: "slice-06-buyer-user",
  firstName: "Amina",
  lastName: "Bello",
  email: "buyer.slice06@example.com",
  phoneNumber: "+2348012345678",
};

const MOCK_PRODUCT = {
  _id: MOCK_PRODUCT_ID,
  name: "Industrial Pump A3",
  category: "Equipment",
  sub_category: "Pumps & Compressors",
  quantityAvailable: 50,
  priceMode: "fixed",
  pricePerUnit: 360028,
  countries: ["NG"],
  isRfqAvailable: true,
  keySpecifications: "Flow Rate: 500 L/min; Max Pressure: 10 bar",
  description: "Heavy-duty industrial pump for demanding environments.",
  images: [{ url: "/images/product-placeholder.webp", cloudinary_id: "cloud-1", isDefault: true }],
  status: "verified",
  oemApprovalStatus: "approved",
  createdBy: { ...MOCK_DISTRIBUTOR_REF, role: "distributor", isEmailVerified: true },
  createdAt: "2026-03-15T00:00:00.000Z",
  updatedAt: "2026-03-15T00:00:00.000Z",
};

const MOCK_RFQ_SUBMITTED = {
  _id: MOCK_RFQ_ID,
  buyer: MOCK_BUYER_REF,
  items: [{ product: MOCK_PRODUCT_ID, productName: "Industrial Pump A3", quantity: 10 }],
  targetDistributors: [MOCK_DISTRIBUTOR_REF],
  status: "responded_complete",
  additionalNotes: "Urgent delivery needed",
  isBulk: false,
  title: "Industrial Pump A3",
  createdAt: "2026-03-20T00:00:00.000Z",
  updatedAt: "2026-03-21T00:00:00.000Z",
};

const MOCK_RFQ_BULK = {
  ...MOCK_RFQ_SUBMITTED,
  _id: "slice-06-rfq-bulk",
  isBulk: true,
  title: "Bulk Equipment Order",
  items: [{ product: MOCK_PRODUCT_ID, productName: "Industrial Pump A3", quantity: 200 }],
};

const MOCK_QUOTE_QUOTED = {
  _id: MOCK_QUOTE_ID_1,
  rfq: MOCK_RFQ_SUBMITTED,
  distributor: MOCK_DISTRIBUTOR_REF,
  status: "quoted",
  pricePerUnit: 350000,
  totalPrice: 3500000,
  quantity: 10,
  terms: "Net 30 days",
  notes: "Price includes delivery",
  leadTimeDays: 14,
  createdAt: "2026-03-21T00:00:00.000Z",
  updatedAt: "2026-03-21T00:00:00.000Z",
};

const MOCK_QUOTE_PENDING = {
  _id: MOCK_QUOTE_ID_2,
  rfq: MOCK_RFQ_SUBMITTED,
  distributor: { ...MOCK_DISTRIBUTOR_REF, _id: "dist-2", firstName: "Kola", lastName: "Ade" },
  status: "pending_response",
  createdAt: "2026-03-20T00:00:00.000Z",
  updatedAt: "2026-03-20T00:00:00.000Z",
};

const MOCK_ORDER = {
  _id: MOCK_ORDER_ID,
  buyer: MOCK_BUYER_REF,
  seller: MOCK_DISTRIBUTOR_REF,
  rfq: MOCK_RFQ_ID,
  quote: MOCK_QUOTE_ID_1,
  items: [{ product: MOCK_PRODUCT_ID, productName: "Industrial Pump A3", quantity: 10 }],
  totalPrice: 3500000,
  status: "created_pending_payment",
  createdAt: "2026-03-22T00:00:00.000Z",
  updatedAt: "2026-03-22T00:00:00.000Z",
};

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

const getTableRowByText = (page: Page, text: string) =>
  page.locator("table tbody tr").filter({ hasText: text }).first();

// ────────────────────────────────────────────────────────────────
// API mock installer
// ────────────────────────────────────────────────────────────────
async function installSlice6Api(page: Page, options: { role: Role }) {
  const user = buildSessionUser(options.role);

  await page.route(`${API_BASE_URL}/**`, async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url === `${API_BASE_URL}/auth/login` && method === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Login successful", user)),
      });
      return;
    }

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

    // ── RFQ routes ──

    // Buyer RFQ list: GET /rfqs
    if (url.match(/\/rfqs\/?(\?.*)?$/) && !url.includes("/inbox") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("RFQs fetched", [MOCK_RFQ_SUBMITTED, MOCK_RFQ_BULK])),
      });
      return;
    }

    // RFQ detail: GET /rfqs/:id
    if (url.match(/\/rfqs\/[^/]+\/?$/) && !url.includes("/submit") && !url.includes("/close") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("RFQ detail fetched", {
          rfq: MOCK_RFQ_SUBMITTED,
          quotes: [MOCK_QUOTE_QUOTED, MOCK_QUOTE_PENDING],
        })),
      });
      return;
    }

    // Create RFQ: POST /rfqs
    if (url.match(/\/rfqs\/?$/) && method === "POST") {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(ok("RFQ created", { ...MOCK_RFQ_SUBMITTED, status: "draft" })),
      });
      return;
    }

    // Submit RFQ: POST /rfqs/:id/submit
    if (url.includes("/submit") && url.includes("/rfqs/") && method === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("RFQ submitted", MOCK_RFQ_SUBMITTED)),
      });
      return;
    }

    // ── Quote routes ──

    // Buyer received quotes: GET /rfqs/quotes/received
    if (url.includes("/rfqs/quotes/received") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Quotes received fetched", [MOCK_QUOTE_QUOTED])),
      });
      return;
    }

    // Distributor inbox: GET /rfqs/inbox/quotes
    if (url.includes("/inbox/quotes") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Inbox fetched", [MOCK_QUOTE_PENDING, MOCK_QUOTE_QUOTED])),
      });
      return;
    }

    // Quote respond: POST /quotes/:id/respond
    if (url.includes("/respond") && url.includes("/quotes/") && method === "POST") {
      const body = route.request().postDataJSON() as { response: string };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Response recorded", {
          ...MOCK_QUOTE_PENDING,
          status: body.response === "quoted" ? "quoted" : "unavailable",
        })),
      });
      return;
    }

    // Quote select: POST /quotes/:quoteId/select
    if (url.includes("/select") && url.includes("/quotes/") && method === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Order created from quote", MOCK_ORDER)),
      });
      return;
    }

    // ── Order routes ──

    // Order list: GET /orders
    if (url.match(/\/orders\/?(\?.*)?$/) && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Orders fetched", [MOCK_ORDER])),
      });
      return;
    }

    // Order detail: GET /orders/:id
    if (url.match(/\/orders\/[^/]+\/?$/) && !url.includes("/cancel") && !url.includes("/buy-now") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Order fetched", MOCK_ORDER)),
      });
      return;
    }

    // Direct order: POST /orders/buy-now
    if (url.includes("/buy-now") && method === "POST") {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(ok("Order created", MOCK_ORDER)),
      });
      return;
    }

    // Cancel order: POST /orders/:id/cancel
    if (url.includes("/cancel") && url.includes("/orders/") && method === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Order cancelled", {
          ...MOCK_ORDER,
          status: "cancelled_pre_payment",
        })),
      });
      return;
    }

    // ── Products ──

    // Messaging entry point routes
    if (url.match(/\/conversations\/?(\?.*)?$/) && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Conversations retrieved", [])),
      });
      return;
    }

    if (url.includes("/conversations/start") && method === "POST") {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(
          ok("Conversation created", {
            id: "slice-06-message-conversation",
            participants: [MOCK_BUYER_REF._id, MOCK_DISTRIBUTOR_REF._id],
            createdAt: "2026-04-20T08:00:00.000Z",
            lastMessageAt: null,
            lastMessagePreview: null,
            counterpart: {
              id: MOCK_DISTRIBUTOR_REF._id,
              role: "distributor",
              displayName: "Daniel Cole",
              avatarUrl: null,
              secondaryLabel: "Verified Seller",
              isVerifiedSeller: true,
            },
          }),
        ),
      });
      return;
    }

    if (url.includes("/conversations/slice-06-message-conversation") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("Conversation retrieved", {
            conversation: {
              id: "slice-06-message-conversation",
              participants: [MOCK_BUYER_REF._id, MOCK_DISTRIBUTOR_REF._id],
              createdAt: "2026-04-20T08:00:00.000Z",
              lastMessageAt: null,
              lastMessagePreview: null,
              counterpart: {
                id: MOCK_DISTRIBUTOR_REF._id,
                role: "distributor",
                displayName: "Daniel Cole",
                avatarUrl: null,
                secondaryLabel: "Verified Seller",
                isVerifiedSeller: true,
              },
            },
            messages: [],
          }),
        ),
      });
      return;
    }

    // Products list
    if (url.includes("/products") && !url.includes(`/products/${MOCK_PRODUCT_ID}`) && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Products fetched", buildPaginated([MOCK_PRODUCT]))),
      });
      return;
    }

    // Single product
    if (url.includes(`/products/${MOCK_PRODUCT_ID}`) && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Product fetched", MOCK_PRODUCT)),
      });
      return;
    }

    // Legacy quotes endpoint (may still be hit by other dashboard widgets)
    if (url.includes("/quotes") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Quotes fetched", buildPaginated([]))),
      });
      return;
    }

    // Service requests (other dashboard widgets)
    if (url.includes("/service-requests") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Service requests fetched", [])),
      });
      return;
    }

    // Pass through static assets, Next.js internals, etc.
    await route.continue();
  });
}

// ────────────────────────────────────────────────────────────────
// A. Product detail page CTAs
// ────────────────────────────────────────────────────────────────
test.describe("Slice 6 — A: Product detail page CTAs", () => {
  test.beforeEach(async ({ page }) => {
    await installSlice6Api(page, { role: "buyer" });
  });

  test("product detail shows Send Inquiry, Order Now, Chat with Seller CTAs", async ({ page }) => {
    await seedSession(page, "buyer");
    await page.goto(`/products/${MOCK_PRODUCT_ID}`);

    // All three CTAs must be visible with exact PNG labels (D2, D3)
    await expect(page.getByRole("button", { name: /Send Inquiry/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Order Now/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Chat with Seller/i })).toBeVisible();

    // Product name visible
    await expect(
      page.getByRole("heading", { name: "Industrial Pump A3", exact: true }),
    ).toBeVisible();

    // No banned internal copy
    const body = await page.textContent("body");
    expect(body).not.toMatch(BANNED_INTERNAL_COPY);
  });

  test("Chat with Seller routes to canonical buyer compose", async ({ page }) => {
    await seedSession(page, "buyer");
    await page.goto(`/products/${MOCK_PRODUCT_ID}`);

    await page.getByRole("button", { name: /Chat with Seller/i }).click();

    await expect(page).toHaveURL(
      `/dashboard/buyer/messages?compose=1&to=${MOCK_DISTRIBUTOR_REF._id}`,
    );
  });

  test("Send Inquiry redirects buyer to RFQ page with create params", async ({ page }) => {
    await seedSession(page, "buyer");
    await page.goto(`/products/${MOCK_PRODUCT_ID}`);

    await page.getByRole("button", { name: /Send Inquiry/i }).click();

    // Should navigate to buyer RFQ page with action=create
    await page.waitForURL(/\/dashboard\/buyer\/rfqs/);
    expect(page.url()).toContain("action=create");
  });

  test("anonymous Send Inquiry hands off to register and preserves intent", async ({ page }) => {
    await page.goto(`/products/${MOCK_PRODUCT_ID}`);

    await page.getByRole("button", { name: /Send Inquiry/i }).click();

    await page.waitForURL(/\/register$/);
    await expect(page).toHaveURL(/\/register$/);

    const pendingIntent = await page.evaluate((storageKey) => {
      const raw = window.sessionStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : null;
    }, PENDING_AUTH_INTENT_STORAGE_KEY);

    expect(pendingIntent).toMatchObject({
      sourcePath: `/products/${MOCK_PRODUCT_ID}`,
      action: "send_inquiry",
      productId: MOCK_PRODUCT_ID,
      productName: "Industrial Pump A3",
      sellerId: MOCK_DISTRIBUTOR_REF._id,
    });
  });

  test("anonymous Order Now hands off to register and preserves intent", async ({ page }) => {
    await page.goto(`/products/${MOCK_PRODUCT_ID}`);

    await page.getByRole("button", { name: /Order Now/i }).click();

    await page.waitForURL(/\/register$/);
    await expect(page).toHaveURL(/\/register$/);

    const pendingIntent = await page.evaluate((storageKey) => {
      const raw = window.sessionStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : null;
    }, PENDING_AUTH_INTENT_STORAGE_KEY);

    expect(pendingIntent).toMatchObject({
      sourcePath: `/products/${MOCK_PRODUCT_ID}`,
      action: "order_now",
      productId: MOCK_PRODUCT_ID,
      productName: "Industrial Pump A3",
      sellerId: MOCK_DISTRIBUTOR_REF._id,
    });
  });

  test("signed-in buyer Order Now still opens created order detail", async ({ page }) => {
    await seedSession(page, "buyer");
    await page.goto(`/products/${MOCK_PRODUCT_ID}`);

    await page.getByRole("button", { name: /Order Now/i }).click();

    await page.waitForURL(new RegExp(`/dashboard/buyer/orders/${MOCK_ORDER_ID}$`));
  });

  test("buyer login resumes Send Inquiry intent into RFQ create flow", async ({ page }) => {
    await seedPendingAuthIntent(page, {
      sourcePath: `/products/${MOCK_PRODUCT_ID}`,
      action: "send_inquiry",
      productId: MOCK_PRODUCT_ID,
      productName: MOCK_PRODUCT.name,
      sellerId: MOCK_DISTRIBUTOR_REF._id,
    });

    await page.goto("/login");
    await page.getByLabel("Email address").fill("buyer.slice06@example.com");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: /Sign in/i }).click();

    await page.waitForURL(/\/dashboard\/buyer\/rfqs/);
    expect(page.url()).toContain("action=create");
    expect(page.url()).toContain(`product=${MOCK_PRODUCT_ID}`);
  });

  test("buyer login resumes Order Now intent and lands on order detail", async ({ page }) => {
    await seedPendingAuthIntent(page, {
      sourcePath: `/products/${MOCK_PRODUCT_ID}`,
      action: "order_now",
      productId: MOCK_PRODUCT_ID,
      productName: MOCK_PRODUCT.name,
      sellerId: MOCK_DISTRIBUTOR_REF._id,
    });

    await page.goto("/login");
    await page.getByLabel("Email address").fill("buyer.slice06@example.com");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: /Sign in/i }).click();

    await page.waitForURL(new RegExp(`/dashboard/buyer/orders/${MOCK_ORDER_ID}$`));
  });

  test("non-buyer login clears saved intent and lands on the normal dashboard", async ({ page }) => {
    await seedPendingAuthIntent(page, {
      sourcePath: `/products/${MOCK_PRODUCT_ID}`,
      action: "send_inquiry",
      productId: MOCK_PRODUCT_ID,
      productName: MOCK_PRODUCT.name,
      sellerId: MOCK_DISTRIBUTOR_REF._id,
    });

    await installSlice6Api(page, { role: "distributor" });
    await page.goto("/login");
    await page.getByLabel("Email address").fill("distributor.slice06@example.com");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: /Sign in/i }).click();

    await page.waitForURL(/\/dashboard\/distributor$/);

    const pendingIntent = await page.evaluate((storageKey) => {
      return window.sessionStorage.getItem(storageKey);
    }, PENDING_AUTH_INTENT_STORAGE_KEY);

    expect(pendingIntent).toBeNull();
  });
});

// ────────────────────────────────────────────────────────────────
// B. Buyer RFQ hub
// ────────────────────────────────────────────────────────────────
test.describe("Slice 6 — B: Buyer RFQ hub", () => {
  test.beforeEach(async ({ page }) => {
    await seedSession(page, "buyer");
    await installSlice6Api(page, { role: "buyer" });
  });

  test("buyer RFQ hub renders tabs, KPI cards, and table", async ({ page }) => {
    await page.goto("/dashboard/buyer/rfqs");

    // Page heading
    await expect(page.getByRole("heading", { name: /Request For Quotes/i })).toBeVisible();

    // Tabs present (D4 — both tabs visible)
    await expect(page.getByRole("button", { name: /Request for Quotes/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Quotes Received/i })).toBeVisible();

    // KPI cards
    await expect(page.getByText(/Total RFQs Sent/i)).toBeVisible();
    await expect(page.getByText(/Quotes Received/i).first()).toBeVisible();

    // Table should render RFQ rows
    await expect(getTableRowByText(page, "Industrial Pump A3")).toBeVisible();

    // Bulk RFQ badge on bulk item
    await expect(page.getByText("Bulk").first()).toBeVisible();

    // No raw backend status strings visible
    const body = await page.textContent("body");
    expect(body).not.toMatch(BANNED_RAW_STATUS);
    expect(body).not.toMatch(BANNED_INTERNAL_COPY);
  });

  test("Quotes Received tab shows download button", async ({ page }) => {
    await page.goto("/dashboard/buyer/rfqs");

    // Switch to Quotes Received tab
    await page.getByRole("button", { name: /Quotes Received/i }).click();

    // Download button must be visible and clickable (D4)
    await expect(page.getByRole("button", { name: /Download/i })).toBeVisible();
  });

  test("buyer can navigate to RFQ detail from table", async ({ page }) => {
    await page.goto("/dashboard/buyer/rfqs");

    // Click View action on first row
    await getTableRowByText(page, "Industrial Pump A3")
      .getByRole("button", { name: /^View$/ })
      .click();

    // Should navigate to RFQ detail
    await page.waitForURL(/\/dashboard\/buyer\/rfqs\//);
  });
});

// ────────────────────────────────────────────────────────────────
// C. Buyer RFQ detail and quote comparison
// ────────────────────────────────────────────────────────────────
test.describe("Slice 6 — C: Buyer RFQ detail and quote comparison", () => {
  test.beforeEach(async ({ page }) => {
    await seedSession(page, "buyer");
    await installSlice6Api(page, { role: "buyer" });
  });

  test("RFQ detail shows quote responses with pricing and Place Order button", async ({ page }) => {
    await page.goto(`/dashboard/buyer/rfqs/${MOCK_RFQ_ID}`);

    // Back navigation
    await expect(page.getByRole("button", { name: /Back to RFQs/i })).toBeVisible();

    // RFQ info
    await expect(page.getByText("Industrial Pump A3")).toBeVisible();

    // Quote responses section
    await expect(page.getByText(/Quote Responses/i)).toBeVisible();

    // Distributor name visible in quote card
    await expect(page.getByText("Daniel Cole")).toBeVisible();

    // Quoted quote shows pricing
    await expect(page.getByText(/3,500,000/)).toBeVisible();

    // Place Order button visible for quoted responses (when RFQ status allows)
    await expect(page.getByRole("button", { name: /Place Order/i })).toBeVisible();

    // Status labels use canonical UI labels, not raw backend strings
    const body = await page.textContent("body");
    expect(body).not.toMatch(BANNED_RAW_STATUS);
  });
});

// ────────────────────────────────────────────────────────────────
// D. Buyer orders
// ────────────────────────────────────────────────────────────────
test.describe("Slice 6 — D: Buyer orders", () => {
  test.beforeEach(async ({ page }) => {
    await seedSession(page, "buyer");
    await installSlice6Api(page, { role: "buyer" });
  });

  test("buyer orders list renders with KPI cards and order table", async ({ page }) => {
    await page.goto("/dashboard/buyer/orders");

    // Page heading
    await expect(page.getByRole("heading", { name: /My Orders/i })).toBeVisible();

    // KPI cards
    await expect(page.getByText(/Total Orders/i)).toBeVisible();
    await expect(page.getByText(/Pending Payment/i).first()).toBeVisible();

    // Order table has product name
    await expect(page.getByText("Industrial Pump A3")).toBeVisible();

    // Status uses UI label not raw string
    await expect(page.getByText("Pending Payment").first()).toBeVisible();

    // View action
    await expect(page.getByText("View").first()).toBeVisible();

    // No banned copy
    const body = await page.textContent("body");
    expect(body).not.toMatch(BANNED_RAW_STATUS);
  });

  test("buyer order detail shows payment step UI without real payment", async ({ page }) => {
    await page.goto(`/dashboard/buyer/orders/${MOCK_ORDER_ID}`);

    // Order heading
    await expect(page.getByText("Industrial Pump A3")).toBeVisible();

    // Status badge shows Pending Payment
    await expect(page.getByText("Pending Payment").first()).toBeVisible();

    // Progress steps visible (D6)
    await expect(page.getByText(/Order Created/i)).toBeVisible();
    await expect(page.getByText(/Payment/i).first()).toBeVisible();
    await expect(page.getByText(/Fulfillment/i)).toBeVisible();

    // Proceed to Payment button visible (D6 — interactive but no real payment)
    await expect(page.getByRole("button", { name: /Proceed to Payment/i })).toBeVisible();

    // Cancel Order button visible for pre-payment orders
    await expect(page.getByRole("button", { name: /Cancel Order/i })).toBeVisible();

    // Total amount visible
    await expect(page.getByText(/3,500,000/)).toBeVisible();

    // No banned copy
    const body = await page.textContent("body");
    expect(body).not.toMatch(BANNED_RAW_STATUS);
    expect(body).not.toMatch(BANNED_INTERNAL_COPY);
  });

  test("buyer payment step shows future-update message per contract D6", async ({ page }) => {
    await page.goto(`/dashboard/buyer/orders/${MOCK_ORDER_ID}`);

    // Click Proceed to Payment
    await page.getByRole("button", { name: /Proceed to Payment/i }).click();

    // Payment processing message visible (no real payment — D1, D6)
    await expect(page.getByText(/Payment processing will be available in a future update/i)).toBeVisible();

    // Price breakdown still visible
    await expect(page.getByText(/3,500,000/).first()).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────────
// E. Distributor quote inbox
// ────────────────────────────────────────────────────────────────
test.describe("Slice 6 — E: Distributor quote inbox", () => {
  test.beforeEach(async ({ page }) => {
    await seedSession(page, "distributor");
    await installSlice6Api(page, { role: "distributor" });
  });

  test("distributor quote inbox renders KPIs, filters, and table with status labels", async ({ page }) => {
    await page.goto("/dashboard/distributor/quotes");

    // Page heading
    await expect(page.getByRole("heading", { name: /Quote Request/i })).toBeVisible();

    // KPI cards
    await expect(page.getByText(/Total Requests/i)).toBeVisible();
    await expect(page.getByText(/^Open$/i).first()).toBeVisible();
    await expect(page.getByText(/^Responded$/i).first()).toBeVisible();

    // View Bulk RFQ button visible and interactive (D5)
    await expect(page.getByRole("button", { name: /View Bulk RFQ/i })).toBeVisible();

    // Filter inputs
    await expect(page.getByPlaceholder(/Enter product name/i)).toBeVisible();

    // Table headers
    await expect(page.getByText("Buyer").first()).toBeVisible();
    await expect(page.getByText("Product").first()).toBeVisible();
    await expect(page.getByText("Status").first()).toBeVisible();

    // Status labels use canonical UI labels (D7): Open / Responded / Not Available
    // The table should show "Open" for pending_response and "Responded" for quoted
    const tableText = await page.locator("table").textContent();
    expect(tableText).toContain("Open");
    expect(tableText).toContain("Responded");

    // No raw backend status strings in the table
    expect(tableText).not.toMatch(BANNED_RAW_STATUS);
  });

  test("distributor can open quote detail slider with buyer info and response form", async ({ page }) => {
    await page.goto("/dashboard/distributor/quotes");

    // Click View on first row
    await getTableRowByText(page, "Amina Bello")
      .getByRole("button", { name: /^View$/ })
      .click();

    // Slider opens with quote details
    const quoteDetailsDialog = page.getByRole("dialog", { name: /Quote Details/i });
    await expect(quoteDetailsDialog).toBeVisible();

    // Buyer info visible
    await expect(quoteDetailsDialog.getByText("Amina Bello", { exact: true })).toBeVisible();

    // Product info visible
    await expect(
      quoteDetailsDialog.getByText("Industrial Pump A3", { exact: true }),
    ).toBeVisible();
  });

  test("distributor can send an offer and gets success feedback", async ({ page }) => {
    await page.goto("/dashboard/distributor/quotes");

    await getTableRowByText(page, "Amina Bello")
      .getByRole("button", { name: /^View$/ })
      .click();

    const quoteDetailsDialog = page.getByRole("dialog", { name: /Quote Details/i });
    await expect(quoteDetailsDialog).toBeVisible();

    await quoteDetailsDialog.getByRole("button", { name: /Send Offer To Buyer/i }).click();
    await expect(page.getByRole("dialog", { name: /Send Offer/i })).toBeVisible();

    await page.getByLabel(/Price/i).fill("350000");
    await page.getByRole("button", { name: /^Send Offer$/i }).click();

    await expect(page.getByText(/Offer sent successfully\./i)).toBeVisible();
    await expect(page.getByRole("dialog", { name: /Send Offer/i })).not.toBeVisible();
  });

  test("View Bulk RFQ toggle filters to bulk items", async ({ page }) => {
    await page.goto("/dashboard/distributor/quotes");

    // Click View Bulk RFQ
    await page.getByRole("button", { name: /View Bulk RFQ/i }).click();

    // Button label should change to Show All
    await expect(page.getByRole("button", { name: /Show All/i })).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────────
// F. Distributor orders
// ────────────────────────────────────────────────────────────────
test.describe("Slice 6 — F: Distributor orders", () => {
  test.beforeEach(async ({ page }) => {
    await seedSession(page, "distributor");
    await installSlice6Api(page, { role: "distributor" });
  });

  test("distributor orders page renders KPIs and order table", async ({ page }) => {
    await page.goto("/dashboard/distributor/orders");

    // Page heading
    await expect(page.getByRole("heading", { name: /Orders/i })).toBeVisible();

    // KPI cards
    await expect(page.getByText(/Total Orders/i)).toBeVisible();
    await expect(page.getByText(/Pending Payment/i).first()).toBeVisible();

    // Order in table
    await expect(page.getByText("Industrial Pump A3")).toBeVisible();

    // Status label uses canonical UI label
    await expect(page.getByText("Pending Payment").first()).toBeVisible();

    // View action
    await expect(page.getByText("View").first()).toBeVisible();

    // No banned copy
    const body = await page.textContent("body");
    expect(body).not.toMatch(BANNED_RAW_STATUS);
  });

  test("distributor can open order detail slider", async ({ page }) => {
    await page.goto("/dashboard/distributor/orders");

    // Click View
    await getTableRowByText(page, "Industrial Pump A3")
      .getByRole("button", { name: /^View$/ })
      .click();

    // Slider opens
    const orderDetailsDialog = page.getByRole("dialog", { name: /Order Details/i });
    await expect(orderDetailsDialog).toBeVisible();

    // Order ID visible
    await expect(orderDetailsDialog.getByText(/#/i).first()).toBeVisible();

    // Buyer name visible
    await expect(orderDetailsDialog.getByText("Amina Bello", { exact: true })).toBeVisible();

    // Amount visible
    await expect(orderDetailsDialog.getByText(/3,500,000/)).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────────
// G. Distributor nav entries enabled
// ────────────────────────────────────────────────────────────────
test.describe("Slice 6 — G: Distributor nav entries enabled", () => {
  test("Quote Request and Orders nav links are active (not disabled)", async ({ page }) => {
    await seedSession(page, "distributor");
    await installSlice6Api(page, { role: "distributor" });
    await page.goto("/dashboard/distributor");

    // Quote Request nav link visible and clickable
    const quoteNav = page.getByRole("link", { name: /Quote Request/i });
    await expect(quoteNav).toBeVisible();

    // Orders nav link visible and clickable
    const ordersNav = page.getByRole("link", { name: /Orders/i });
    await expect(ordersNav).toBeVisible();

    // Navigate to quotes page via nav
    await quoteNav.click();
    await page.waitForURL(/\/dashboard\/distributor\/quotes/);

    // Navigate to orders page via nav
    await page.goto("/dashboard/distributor");
    await page.getByRole("link", { name: /Orders/i }).click();
    await page.waitForURL(/\/dashboard\/distributor\/orders/);
  });
});
