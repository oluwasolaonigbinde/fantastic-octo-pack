/**
 * Figma vs Implementation — Buyer Portal capture spec (Batch 1)
 *
 * Reads docs/visual-alignment/frame-map.buyer.json at runtime.
 * For every "mapped" entry, captures a screenshot at the specified viewport.
 * Outputs to: visual-results/figma-diff/actual/buyer/{viewport}/{slug}.png
 *
 * Supported states (frame-map `state` field):
 *   "route"                       — navigate and capture full-page (default)
 *   "route-with-query"            — navigate with stateParams as query string, capture full-page
 *   "mobile-overlay"              — navigate with stateParams as query string, capture viewport only (fixed overlay)
 *   "open-service-request-detail" — navigate, click View on first row to open detail dialog, capture viewport
 *
 * Run (frontend-only, default):
 *   node scripts/run-local-e2e.mjs --mode frontend-only -- e2e/visual/figma-sync-buyer.spec.ts
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

// ─── Mock buyer user ──────────────────────────────────────────────────────────

const BUYER_USER = {
  _id: "figma-diff-buyer-user",
  firstName: "Otor",
  lastName: "John Stephen",
  email: "buyer.figmadiff@local.test",
  phoneNumber: "+2348012345678",
  address: "14 Victoria Island, Lagos",
  role: "buyer",
  status: "active",
  isEmailVerified: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  tokens: {
    accessToken: "figma-diff-buyer-access-token-placeholder",
    refreshToken: "figma-diff-buyer-refresh-token-placeholder",
  },
};

// ─── Mock engineer (for service-request-form + service-request-ongoing) ────────

const MOCK_ENGINEER = {
  _id: "mock-engineer-001",
  firstName: "Samuel",
  lastName: "Smart",
  email: "samuel.smart@local.test",
  phoneNumber: "+2348006000000",
  role: "engineer",
  engineerAvailability: "available",
  oemCertified: true,
  specializations: ["Installation", "Repair"],
  address: "Lagos, Nigeria",
  rating: 4.5,
  reviewCount: 12,
  status: "active",
  isEmailVerified: true,
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
};

// ─── Mock in-progress service request ─────────────────────────────────────────

const MOCK_IN_PROGRESS_SERVICE_REQUEST = {
  _id: "mock-service-request-001",
  status: "in_progress",
  jobType: "Installation",
  price: 150000,
  unitPrice: 60028,
  equipmentName: "The name of the product",
  model: "GE Signa HDxt 1.5T",
  brand: "GE",
  serviceLocation: "Lagos, Nigeria",
  serviceDescription:
    "Figma ipsum component variant main layer. Outline arrange main vector text. Figma follower auto reesizing bold selection opacity device flatten.",
  preferredDate: "2025-12-09T00:00:00.000Z",
  preferredTime: "10:00 AM",
  createdAt: "2025-09-12T00:00:00.000Z",
  updatedAt: "2025-12-09T00:00:00.000Z",
  engineer: {
    _id: MOCK_ENGINEER._id,
    firstName: MOCK_ENGINEER.firstName,
    lastName: MOCK_ENGINEER.lastName,
    email: MOCK_ENGINEER.email,
    phoneNumber: "0800600000",
  },
  buyer: BUYER_USER._id,
  disputeActive: false,
  activeDisputeId: null,
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

const MOCK_RFQ = {
  _id: "rfq-mock-001",
  title: "Industrial Compressor — Model X3",
  description: "Quote request for 3 units of industrial air compressor",
  quantity: 3,
  targetPrice: 1500000,
  currency: "NGN",
  status: "pending",
  buyer: {
    _id: BUYER_USER._id,
    firstName: BUYER_USER.firstName,
    lastName: BUYER_USER.lastName,
    email: BUYER_USER.email,
  },
  deadline: "2026-05-30T00:00:00.000Z",
  createdAt: "2026-04-01T00:00:00.000Z",
  updatedAt: "2026-04-01T00:00:00.000Z",
};

const MOCK_ORDER = {
  _id: "order-mock-001",
  orderNumber: "ORD-2026-001",
  buyer: { _id: BUYER_USER._id, firstName: "Amina", lastName: "Bello" },
  product: {
    _id: "prod-mock-001",
    name: "Industrial Pump A3",
    images: [{ url: "/images/product-placeholder.webp", isDefault: true }],
  },
  quantity: 2,
  totalAmount: 720056,
  status: "ongoing",
  paymentStatus: "paid",
  deliveryStatus: "in_transit",
  createdAt: "2026-03-15T00:00:00.000Z",
  updatedAt: "2026-04-01T00:00:00.000Z",
};

// ─── Frame map types ──────────────────────────────────────────────────────────

const MOCK_BUYER_KYC_TIERS = [
  {
    tierKey: "basic_buyer",
    routeSlug: "basic-buyer",
    tierLabel: "Basic Buyer",
    tierOrdinal: 1,
    processingTime: null,
    isAutoGranted: false,
    submissionBehavior: "none",
    requiredTextFields: [
      { fieldName: "firstName", label: "First name", inputType: "text" },
      { fieldName: "lastName", label: "Last name", inputType: "text" },
      { fieldName: "email", label: "First Email address", inputType: "text" },
      { fieldName: "phoneNumber", label: "Phone number", inputType: "text" },
    ],
    requiredDocuments: [],
    detailTitle: "Basic Buyer",
    detailSubtitle: "View all uploaded requirement",
    badgeLabel: "Basic Buyer",
  },
  {
    tierKey: "verified_buyer",
    routeSlug: "verified-buyer",
    tierLabel: "Verified Buyer",
    tierOrdinal: 2,
    processingTime: "Processing time 24-48 hours",
    isAutoGranted: false,
    submissionBehavior: "review_required",
    requiredTextFields: [],
    requiredDocuments: [
      { fieldName: "nationalId", label: "National ID" },
      { fieldName: "proofOfAddress", label: "Proof of address" },
    ],
    detailTitle: "Verified Buyer",
    detailSubtitle: "View all uploaded requirement",
    badgeLabel: "Verified Buyer",
  },
  {
    tierKey: "premium_buyer",
    routeSlug: "premium-buyer",
    tierLabel: "Business Buyer",
    tierOrdinal: 3,
    processingTime: "Processing time 24-48 hours",
    isAutoGranted: false,
    submissionBehavior: "review_required",
    requiredTextFields: [],
    requiredDocuments: [
      { fieldName: "cac", label: "CAC" },
      { fieldName: "cacStatusReport", label: "CAC Status Report" },
    ],
    detailTitle: "Business Buyer",
    detailSubtitle: "View all uploaded requirement",
    badgeLabel: "Business Buyer",
  },
];

const MOCK_BUYER_KYC_SUBMISSIONS = [
  {
    _id: "buyer-kyc-basic-submission",
    userId: BUYER_USER._id,
    userRole: "buyer",
    tierKey: "basic_buyer",
    tierLabel: "Basic Buyer",
    routeSlug: "basic-buyer",
    status: "approved",
    textFields: {
      firstName: "BAIY LTD",
      lastName: "BAIY LTD",
      email: "example2@gmail.com",
      phoneNumber: "08184318676",
    },
    documents: [],
    rejectionReason: null,
    reviewedBy: null,
    reviewedAt: "2026-04-01T09:00:00.000Z",
    submittedAt: "2026-04-01T09:00:00.000Z",
    createdAt: "2026-04-01T09:00:00.000Z",
    updatedAt: "2026-04-01T09:00:00.000Z",
  },
  {
    _id: "buyer-kyc-verified-submission",
    userId: BUYER_USER._id,
    userRole: "buyer",
    tierKey: "verified_buyer",
    tierLabel: "Verified Buyer",
    routeSlug: "verified-buyer",
    status: "approved",
    textFields: {},
    documents: [
      {
        fieldName: "nationalId",
        fileName: "national-id.pdf",
        fileType: "application/pdf",
        fileUrl: "#",
        cloudinaryId: "figma-national-id",
        uploadedAt: "2026-04-02T09:00:00.000Z",
      },
      {
        fieldName: "proofOfAddress",
        fileName: "proof-of-address.pdf",
        fileType: "application/pdf",
        fileUrl: "#",
        cloudinaryId: "figma-proof-of-address",
        uploadedAt: "2026-04-02T09:00:00.000Z",
      },
    ],
    rejectionReason: null,
    reviewedBy: null,
    reviewedAt: "2026-04-02T09:00:00.000Z",
    submittedAt: "2026-04-02T09:00:00.000Z",
    createdAt: "2026-04-02T09:00:00.000Z",
    updatedAt: "2026-04-02T09:00:00.000Z",
  },
  {
    _id: "buyer-kyc-premium-submission",
    userId: BUYER_USER._id,
    userRole: "buyer",
    tierKey: "premium_buyer",
    tierLabel: "Business Buyer",
    routeSlug: "premium-buyer",
    status: "submitted",
    textFields: {},
    documents: [
      {
        fieldName: "cac",
        fileName: "CAC.png",
        fileType: "image/png",
        fileUrl: "#",
        cloudinaryId: "figma-cac",
        uploadedAt: "2025-04-26T05:09:00.000Z",
      },
      {
        fieldName: "cacStatusReport",
        fileName: "CAC Status Report.pdf",
        fileType: "application/pdf",
        fileUrl: "#",
        cloudinaryId: "figma-cac-status-report",
        uploadedAt: "2025-04-26T05:09:00.000Z",
      },
    ],
    rejectionReason: null,
    reviewedBy: null,
    reviewedAt: null,
    submittedAt: "2025-04-26T05:09:00.000Z",
    createdAt: "2025-04-26T05:09:00.000Z",
    updatedAt: "2025-04-26T05:09:00.000Z",
  },
];

interface FrameMapEntry {
  figmaFrameName: string;
  nodeId: string | null;
  figmaSection: string;
  route: string | null;
  role: string | null;
  viewport: number | null;
  slug: string | null;
  status: "mapped" | "unmatched" | "out-of-scope" | "needs-review";
  state?: "route" | "route-with-query" | "mobile-overlay" | "open-service-request-detail";
  stateParams?: Record<string, string>;
  notes?: string;
}

const FRAME_MAP_PATH = path.join(
  process.cwd(),
  "..",
  "..",
  "docs",
  "visual-alignment",
  "frame-map.buyer.json",
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
    (entry.state === "route-with-query" || entry.state === "route" || entry.state === "mobile-overlay") &&
    entry.stateParams &&
    Object.keys(entry.stateParams).length > 0
  ) {
    const qs = new URLSearchParams(entry.stateParams).toString();
    return `${base}?${qs}`;
  }
  return base;
}

function expectedTextFor(entry: FrameMapEntry): string | RegExp {
  if (entry.slug?.includes("kyc")) return /KYC Verification|Basic Buyer|View all uploaded requirement/i;
  if (entry.slug?.includes("wallet") || entry.slug?.includes("payment")) return /Wallet|Payment/i;
  if (entry.slug?.includes("order") || entry.slug?.includes("dispute")) return /Orders|Disputes|My Orders/i;
  if (entry.slug?.includes("rfq")) return /RFQ|Request For Quote|Quotes/i;
  if (entry.slug?.includes("message")) return /Messages|Messaging/i;
  if (entry.slug?.includes("service")) return /Service|Engineer/i;
  if (entry.slug?.includes("profile")) return /Profile|Personal Information/i;
  if (entry.slug?.includes("dashboard")) return /Dashboard|RFQs|Orders/i;
  return /Dashboard|KYC|Orders|RFQ|Messages|Profile/i;
}

async function waitForBuyerContent(page: import("@playwright/test").Page, entry: FrameMapEntry) {
  const expectedText = expectedTextFor(entry);
  await page.waitForFunction(
    ({ source, flags, text }) => {
      const bodyText = document.body.innerText;
      if (/This page couldn.t load|Reload to try again|Application error/i.test(bodyText)) {
        return false;
      }
      return source
        ? new RegExp(source, flags).test(bodyText)
        : bodyText.includes(text ?? "");
    },
    typeof expectedText === "string"
      ? { text: expectedText }
      : { source: expectedText.source, flags: expectedText.flags },
    { timeout: 15000 },
  );
}

const OUT_BASE = path.join(
  process.cwd(),
  "visual-results",
  "figma-diff",
  "actual",
  "buyer",
);

// ─── API mock installer ───────────────────────────────────────────────────────

async function installBuyerApiMocks(page: import("@playwright/test").Page) {
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
          ok("Profile fetched successfully", { ...BUYER_USER, tokens: undefined }),
        ),
      });
      return;
    }

    // Public engineer profile by ID (used on /service-engineers/profile?id=...)
    if (url.includes(`/public/profiles/${MOCK_ENGINEER._id}`) && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Profile fetched", MOCK_ENGINEER)),
      });
      return;
    }

    // Public profiles list (service engineers browse)
    if (url.includes("/public/profiles") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Profiles fetched", buildPaginated([MOCK_ENGINEER]))),
      });
      return;
    }

    // Engineer reviews
    if (url.includes("/reviews/engineer") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Reviews fetched", [])),
      });
      return;
    }

    // RFQs (buyer)
    if (url.includes("/rfqs") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("RFQs fetched successfully", buildPaginated([MOCK_RFQ])),
        ),
      });
      return;
    }

    // Quotes
    if (url.includes("/quotes") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Quotes fetched successfully", buildPaginated([]))),
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

    // Service requests — return one in-progress request so the table is populated
    if (url.includes("/service-requests") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("Service requests fetched successfully", buildPaginated([MOCK_IN_PROGRESS_SERVICE_REQUEST])),
        ),
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

    // KYC
    if (url.endsWith("/kyc/tiers") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("KYC tiers fetched successfully", MOCK_BUYER_KYC_TIERS),
        ),
      });
      return;
    }

    if (url.endsWith("/kyc/submissions") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("KYC submissions fetched successfully", MOCK_BUYER_KYC_SUBMISSIONS),
        ),
      });
      return;
    }

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

    // Wallet / payments
    if ((url.includes("/wallet") || url.includes("/payment")) && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("Wallet fetched", {
            balance: 0,
            currency: "NGN",
            transactions: [],
          }),
        ),
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

    // Service engineers list (buyer dashboard browse)
    if (url.includes("/service-engineers") || url.includes("/engineers")) {
      if (method === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(ok("Engineers fetched", buildPaginated([]))),
        });
        return;
      }
    }

    // Products (wishlist etc.)
    if (url.includes("/products") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Products fetched", buildPaginated([]))),
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

    // Users / profiles
    if (url.includes("/users") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Users fetched", buildPaginated([]))),
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

    // Default: pass through (allows Next.js static assets)
    await route.continue();
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

const mapped = loadMappedEntries();

test.describe("Buyer Portal — Figma diff screenshots", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      ([key, val]) => window.localStorage.setItem(key, val),
      [AUTH_SESSION_STORAGE_KEY, JSON.stringify(BUYER_USER)],
    );
    await installBuyerApiMocks(page);
  });

  for (const entry of mapped) {
    const { slug, viewport } = entry as Required<FrameMapEntry>;
    const entryState = entry.state ?? "route";
    const url = buildUrl(entry);

    test(`buyer | ${viewport} | ${slug} — ${url}`, async ({ page }) => {
      const outDir = path.join(OUT_BASE, String(viewport));
      await fs.promises.mkdir(outDir, { recursive: true });

      await page.setViewportSize({ width: viewport, height: 900 });
      await page.goto(url, { waitUntil: "domcontentloaded" });

      await page.waitForLoadState("networkidle").catch(() => {});
      await page.evaluate(() => document.fonts.ready);
      await waitForBuyerContent(page, entry);
      await page.waitForTimeout(1000);

      const outPath = path.join(outDir, `${slug}.png`);

      if (entryState === "mobile-overlay") {
        // Fixed full-screen overlay — capture viewport only (the overlay is position:fixed)
        await page.waitForSelector(".fixed.inset-0", { timeout: 6000 }).catch(() => {});
        await page.waitForTimeout(400);
        await page.screenshot({ path: outPath, fullPage: false });
      } else if (entryState === "open-service-request-detail") {
        // Wait for the "View" button on the populated service-request row
        await page.waitForSelector('button:has-text("View")', { timeout: 8000 }).catch(() => {});
        await page.click('button:has-text("View")').catch(() => {});

        // Wait for the dialog to mount and animate in
        await page.waitForSelector('[role="dialog"]', { timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(600);

        // Hide the dialog backdrop so the comparison focuses on the modal content
        await page.addStyleTag({
          content: `
            [data-state="open"][data-radix-dialog-overlay],
            .fixed.inset-0.bg-black\\/50,
            .fixed.inset-0[class*="bg-black"] {
              opacity: 0 !important;
            }
          `,
        });
        await page.waitForTimeout(200);

        // Capture viewport only (dialog is fixed-position, not in scroll flow)
        await page.screenshot({ path: outPath, fullPage: false });
      } else {
        // Default: full-page route capture
        await page.screenshot({ path: outPath, fullPage: true });
      }
    });
  }
});
