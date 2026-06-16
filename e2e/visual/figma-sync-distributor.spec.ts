/**
 * Figma vs Implementation — Distributor Portal capture spec (Batch 2)
 *
 * Reads docs/visual-alignment/frame-map.distributor.json at runtime.
 * For every "mapped" entry, captures a screenshot at the specified viewport.
 * Outputs to: visual-results/figma-diff/actual/distributor/{viewport}/{slug}.png
 *
 * Supported states (frame-map `state` field):
 *   "route"            — navigate and capture full-page (default)
 *   "route-with-query" — navigate with stateParams as query string, capture full-page
 *
 * Run (frontend-only, default):
 *   node scripts/run-local-e2e.mjs --mode frontend-only -- e2e/visual/figma-sync-distributor.spec.ts
 *
 * This spec does NOT modify existing snapshot baselines.
 */
import fs from "node:fs";
import path from "node:path";

import { test } from "@playwright/test";

// ─── Auth session key ──────────────────────────────────────────────────────────
const AUTH_SESSION_STORAGE_KEY = "baiy.auth.session";

const API_BASE_URL =
  process.env.PLAYWRIGHT_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000/api/v1";

// ─── Mock distributor user ────────────────────────────────────────────────────

const DISTRIBUTOR_USER = {
  _id: "figma-diff-distributor-user",
  firstName: "Chidi",
  lastName: "Okonkwo",
  email: "distributor.figmadiff@local.test",
  phoneNumber: "+2348099887766",
  address: "22 Apapa Road, Lagos",
  role: "distributor",
  status: "active",
  isEmailVerified: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  tokens: {
    accessToken: "figma-diff-distributor-access-token-placeholder",
    refreshToken: "figma-diff-distributor-refresh-token-placeholder",
  },
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_PRODUCT = {
  _id: "prod-dist-001",
  name: "Philips Ultrasound HD-7",
  description: "High-definition portable ultrasound machine",
  category: "equipment",
  price: 3500000,
  currency: "NGN",
  status: "approved",
  images: [{ url: "/images/product-placeholder.webp", isDefault: true }],
  createdBy: {
    _id: DISTRIBUTOR_USER._id,
    firstName: DISTRIBUTOR_USER.firstName,
    lastName: DISTRIBUTOR_USER.lastName,
  },
  createdAt: "2026-02-10T00:00:00.000Z",
  updatedAt: "2026-04-01T00:00:00.000Z",
};

const MOCK_PRODUCT_PENDING = {
  ...MOCK_PRODUCT,
  _id: "prod-dist-002",
  name: "GE ECG Monitor X3",
  category: "equipment",
  status: "pending",
};

const MOCK_PRODUCT_CONSUMABLE = {
  ...MOCK_PRODUCT,
  _id: "prod-dist-003",
  name: "IV Cannula Box",
  category: "consumables",
  status: "approved",
};

const MOCK_ORDER = {
  _id: "order-dist-001",
  orderNumber: "ORD-2026-D01",
  buyer: { _id: "buyer-001", firstName: "Amina", lastName: "Bello" },
  distributor: {
    _id: DISTRIBUTOR_USER._id,
    firstName: DISTRIBUTOR_USER.firstName,
    lastName: DISTRIBUTOR_USER.lastName,
  },
  product: {
    _id: MOCK_PRODUCT._id,
    name: MOCK_PRODUCT.name,
    images: MOCK_PRODUCT.images,
  },
  quantity: 1,
  totalAmount: 3500000,
  status: "processing",
  paymentStatus: "paid",
  deliveryStatus: "pending",
  createdAt: "2026-03-10T00:00:00.000Z",
  updatedAt: "2026-04-01T00:00:00.000Z",
};

const MOCK_QUOTE = {
  _id: "quote-dist-001",
  rfq: {
    _id: "rfq-001",
    title: "Ultrasound Machine — 2 units",
    status: "pending",
    deadline: "2026-05-30T00:00:00.000Z",
    buyer: { _id: "buyer-001", firstName: "Amina", lastName: "Bello" },
  },
  distributor: {
    _id: DISTRIBUTOR_USER._id,
    firstName: DISTRIBUTOR_USER.firstName,
    lastName: DISTRIBUTOR_USER.lastName,
  },
  status: "pending",
  pricePerUnit: 3500000,
  totalPrice: 7000000,
  quantity: 2,
  currency: "NGN",
  createdAt: "2026-04-01T00:00:00.000Z",
  updatedAt: "2026-04-01T00:00:00.000Z",
};

// ─── Mock data helpers ────────────────────────────────────────────────────────

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

// ─── Frame map types ──────────────────────────────────────────────────────────

interface FrameMapEntry {
  figmaFrameName: string;
  nodeId: string | null;
  figmaSection: string;
  route: string | null;
  role: string | null;
  viewport: number | null;
  slug: string | null;
  status: "mapped" | "unmatched" | "out-of-scope" | "needs-review";
  state?: "route" | "route-with-query";
  stateParams?: Record<string, string>;
  notes?: string;
}

const FRAME_MAP_PATH = path.join(
  process.cwd(),
  "..",
  "..",
  "docs",
  "visual-alignment",
  "frame-map.distributor.json",
);

function loadMappedEntries(): FrameMapEntry[] {
  const raw = fs.readFileSync(FRAME_MAP_PATH, "utf8");
  const all: FrameMapEntry[] = JSON.parse(raw);
  return all.filter(
    (e) =>
      e.status === "mapped" &&
      e.route !== null &&
      e.viewport !== null &&
      e.slug !== null,
  );
}

function buildUrl(entry: FrameMapEntry): string {
  const base = entry.route!;
  if (
    entry.state === "route-with-query" &&
    entry.stateParams &&
    Object.keys(entry.stateParams).length > 0
  ) {
    const qs = new URLSearchParams(entry.stateParams).toString();
    return `${base}?${qs}`;
  }
  return base;
}

const OUT_BASE = path.join(
  process.cwd(),
  "visual-results",
  "figma-diff",
  "actual",
  "distributor",
);

// ─── API mock installer ───────────────────────────────────────────────────────

async function installDistributorApiMocks(page: import("@playwright/test").Page) {
  await page.route(`${API_BASE_URL}/**`, async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    // Auth profile
    if (
      (url.includes("/auth/profile") || url.includes("/auth/me")) &&
      method === "GET"
    ) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("Profile fetched successfully", { ...DISTRIBUTOR_USER, tokens: undefined }),
        ),
      });
      return;
    }

    // Products — distributor's own catalogue (createdBy=<id> or generic list)
    if (url.includes("/products") && method === "GET") {
      const pathname = new URL(url).pathname;
      // Single product by ID
      if (pathname.match(/\/products\/[^/]+$/)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(ok("Product fetched", MOCK_PRODUCT)),
        });
        return;
      }
      // List
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("Products fetched", buildPaginated([
            MOCK_PRODUCT,
            MOCK_PRODUCT_PENDING,
            MOCK_PRODUCT_CONSUMABLE,
          ])),
        ),
      });
      return;
    }

    // Categories
    if (url.includes("/categories") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("Categories fetched", buildPaginated([
            { _id: "cat-eq", name: "Equipment", description: "Industrial equipment" },
            { _id: "cat-con", name: "Consumables", description: "Consumables" },
          ])),
        ),
      });
      return;
    }

    // Orders
    if (url.includes("/orders") && method === "GET") {
      const pathname = new URL(url).pathname;
      const isListPath =
        pathname.endsWith("/orders") || pathname.endsWith("/orders/");
      if (isListPath) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(
            ok("Orders fetched successfully", buildPaginated([MOCK_ORDER])),
          ),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Order fetched successfully", MOCK_ORDER)),
      });
      return;
    }

    // RFQ inbox quotes (distributor receives quotes to respond to)
    if (url.includes("/rfqs/inbox") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Inbox fetched", [MOCK_QUOTE])),
      });
      return;
    }

    // RFQs — fallback
    if (url.includes("/rfqs") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("RFQs fetched successfully", buildPaginated([MOCK_QUOTE])),
        ),
      });
      return;
    }

    // Wallet / payments
    if ((url.includes("/wallet") || url.includes("/payment")) && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("Wallet fetched", {
            balance: 450000,
            currency: "NGN",
            transactions: [],
          }),
        ),
      });
      return;
    }

    // KYC
    if (url.includes("/kyc") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("KYC status fetched", {
            tier: 1,
            status: "not_started",
            documents: [],
          }),
        ),
      });
      return;
    }

    // Subscription
    if (url.includes("/subscription") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Subscription fetched", { plan: "free", status: "active" })),
      });
      return;
    }

    // Messages / conversations
    if (
      (url.includes("/messages") || url.includes("/conversations")) &&
      method === "GET"
    ) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Messages fetched successfully", buildPaginated([]))),
      });
      return;
    }

    // Notifications
    if (url.includes("/notifications") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Notifications fetched", buildPaginated([]))),
      });
      return;
    }

    // Users / profiles
    if (url.includes("/users") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Users fetched", buildPaginated([]))),
      });
      return;
    }

    // Service engineers (distributor may browse)
    if (
      (url.includes("/service-engineers") || url.includes("/engineers")) &&
      method === "GET"
    ) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Engineers fetched", buildPaginated([]))),
      });
      return;
    }

    // Default: pass through (allows Next.js static assets)
    await route.continue();
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

const mapped = loadMappedEntries();

test.describe("Distributor Portal — Figma diff screenshots", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      ([key, val]) => window.localStorage.setItem(key, val),
      [AUTH_SESSION_STORAGE_KEY, JSON.stringify(DISTRIBUTOR_USER)],
    );
    await installDistributorApiMocks(page);
  });

  for (const entry of mapped) {
    const { slug, viewport } = entry as Required<FrameMapEntry>;
    const url = buildUrl(entry);

    test(`distributor | ${viewport} | ${slug} — ${url}`, async ({ page }) => {
      const outDir = path.join(OUT_BASE, String(viewport));
      await fs.promises.mkdir(outDir, { recursive: true });

      await page.setViewportSize({ width: viewport, height: 900 });
      await page.goto(url, { waitUntil: "domcontentloaded" });

      await page.waitForLoadState("networkidle").catch(() => {});
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1000);

      const outPath = path.join(outDir, `${slug}.png`);
      await page.screenshot({ path: outPath, fullPage: true });
    });
  }
});
