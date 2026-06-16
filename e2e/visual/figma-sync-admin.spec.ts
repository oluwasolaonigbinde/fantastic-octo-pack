/**
 * Figma vs Implementation - Super Admin Portal capture spec
 *
 * Reads docs/visual-alignment/frame-map.admin.json at runtime.
 * Captures every mapped Super Admin entry to:
 * visual-results/figma-diff/actual/admin/{viewport}/{slug}.png
 *
 * Run:
 *   node ../../scripts/run-local-e2e.mjs --mode frontend-only -- e2e/visual/figma-sync-admin.spec.ts
 */
import fs from "node:fs";
import path from "node:path";

import { test } from "@playwright/test";

const AUTH_SESSION_STORAGE_KEY = "baiy.auth.session";

const API_BASE_URL =
  process.env.PLAYWRIGHT_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000/api/v1";

interface FrameMapEntry {
  figmaFrameName: string;
  nodeId: string | null;
  figmaSection: string;
  route: string | null;
  role: string | null;
  viewport: number | null;
  slug: string | null;
  status: "mapped" | "unmatched" | "out-of-scope" | "needs-review";
  state?: "route" | "click-tab" | "open-first-row-detail";
  stateParams?: Record<string, string>;
  notes?: string;
}

const ADMIN_USER = {
  _id: "figma-diff-admin-user",
  firstName: "Otor John",
  lastName: "Stephen",
  email: "otorjohnst@gmail.com",
  phoneNumber: "08130000000",
  dateOfBirth: "2025-05-04T00:00:00.000Z",
  address: "No 38 Ashiek Jarma Street, Opposite AA Rano fuel Station. Nasarawa State",
  displayPhoto: {
    url: "/images/profile.webp",
  },
  role: "admin",
  status: "active",
  isEmailVerified: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  tokens: {
    accessToken: "figma-diff-admin-access-token-placeholder",
    refreshToken: "figma-diff-admin-refresh-token-placeholder",
  },
};

const FRAME_MAP_PATH = path.join(
  process.cwd(),
  "..",
  "..",
  "docs",
  "visual-alignment",
  "frame-map.admin.json",
);

const OUT_BASE = path.join(
  process.cwd(),
  "visual-results",
  "figma-diff",
  "actual",
  "admin",
);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const ok = (message: string, data: unknown) => ({
  success: true,
  message,
  data,
});

const paginated = <T,>(docs: T[], limit = 20) => ({
  docs,
  totalDocs: docs.length,
  limit,
  totalPages: 1,
  page: 1,
  hasNextPage: false,
  hasPreviousPage: false,
  nextPage: null,
  previousPage: null,
});

function loadMappedEntries(): FrameMapEntry[] {
  const raw = fs.readFileSync(FRAME_MAP_PATH, "utf8");
  const all = JSON.parse(raw) as FrameMapEntry[];
  return all.filter(
    (entry) =>
      entry.status === "mapped" &&
      entry.route !== null &&
      entry.viewport !== null &&
      entry.slug !== null,
  );
}

function buildDashboardSummary() {
  return {
    users: {
      total: 1208,
      buyers: 805,
      distributors: 203,
      oems: 200,
      engineers: 0,
      agents: 0,
    },
    rfqs: {
      total: 518,
      rfqsSent: 310,
      quotesSent: 208,
    },
    revenue: {
      supported: true,
      total: 410032800,
      monthly: MONTHS.map((month, index) => ({
        month,
        total: [13500000, 19000000, 8500000, 21500000, 13500000, 25000000, 17500000, 12800000, 19500000, 7000000, 15500000, 13500000][index],
      })),
    },
    approvals: {
      total: 108,
      accounts: 18,
      productListings: 90,
    },
    onboardingAnalytics: MONTHS.map((month, index) => ({
      month,
      buyers: [82, 128, 149, 82, 83, 204, 128, 137, 84, 149, 256, 149][index],
      distributors: [168, 83, 168, 104, 168, 83, 219, 90, 123, 168, 168, 168][index],
      oems: [123, 218, 123, 123, 123, 155, 98, 218, 55, 123, 196, 123][index],
      engineers: [110, 64, 196, 110, 110, 110, 74, 110, 110, 235, 110, 196][index],
    })),
    topProductsByRfqs: [
      { id: "prod-1", name: "The product's name", rfqCount: 312, imageUrl: null },
      { id: "prod-2", name: "The product's name", rfqCount: 312, imageUrl: null },
      { id: "prod-3", name: "The product's name", rfqCount: 312, imageUrl: null },
      { id: "prod-4", name: "The product's name", rfqCount: 312, imageUrl: null },
    ],
    recentUsers: [
      { id: "buyer-1", name: "The product's name", type: "Distributor", dateOnboarded: "2025-09-26T09:25:00.000Z", avatarUrl: null },
      { id: "dist-1", name: "The product's name", type: "Distributor", dateOnboarded: "2025-09-26T09:25:00.000Z", avatarUrl: null },
      { id: "oem-1", name: "The product's name", type: "Distributor", dateOnboarded: "2025-09-26T09:25:00.000Z", avatarUrl: null },
      { id: "eng-1", name: "The product's name", type: "Distributor", dateOnboarded: "2025-09-26T09:25:00.000Z", avatarUrl: null },
    ],
  };
}

function platformUsers(role: string | null) {
  const roleLabel = role === "distributor"
    ? "Distributor"
    : role === "oem"
      ? "OEM"
      : role === "agent"
        ? "Agent"
        : role === "engineer"
          ? "Service Engineer"
          : "Buyer";

  return Array.from({ length: 8 }).map((_, index) => ({
    id: `${role ?? "buyer"}-${index + 1}`,
    name: index === 0 ? "The name of the user" : `${roleLabel} ${index + 1}`,
    email: `${role ?? "buyer"}${index + 1}@figmadiff.local`,
    phoneNumber: "08130000000",
    role: role ?? "buyer",
    roleLabel,
    status: "approved",
    dateRegistered: "2026-04-01T09:00:00.000Z",
    dateVerified: "2026-04-02T09:00:00.000Z",
    country: "Nigeria",
    avatarUrl: null,
    metrics: {
      rfqsSent: 28 + index,
      quoteReceived: 12 + index,
      listedProducts: 20 + index,
      totalQuoteSent: 18 + index,
      listingRequest: 9 + index,
      approvedListing: 7 + index,
      productCategory: "Equipment maintenance",
    },
  }));
}

const PRODUCT_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='900' height='640' viewBox='0 0 900 640'%3E%3Crect width='900' height='640' fill='%23e8f2ff'/%3E%3Crect x='185' y='140' width='530' height='360' rx='36' fill='%23ffffff' stroke='%230066e6' stroke-width='16'/%3E%3Ccircle cx='450' cy='320' r='112' fill='%230066e6' opacity='.12'/%3E%3Cpath d='M382 326h136M450 258v136' stroke='%230066e6' stroke-width='28' stroke-linecap='round'/%3E%3C/svg%3E";

function buildAdminProduct(index = 0) {
  return {
    _id: index === 0 ? "figma-admin-product" : `figma-admin-product-${index + 1}`,
    name: index === 0 ? "Digital X-ray Imaging System" : `Medical Equipment ${index + 1}`,
    category: "Medical Equipment",
    sub_category: "Radiology",
    brand_oem: "MedTech OEM",
    manufacturing_country: "Germany",
    condition: "new",
    quantityAvailable: 120 - index,
    priceMode: "fixed",
    pricePerUnit: 6002800,
    pricing_type: "fixed",
    unit_of_measure: "Unit",
    countries: ["Nigeria"],
    isRfqAvailable: true,
    keySpecifications: "Power: 220V; Warranty: 24 months; Installation: Included; Model: DX-900",
    key_attributes: {
      industry_specific: [
        { spec: "Detector type", detail: "Flat panel detector" },
        { spec: "Output", detail: "High-resolution diagnostic imaging" },
      ],
      other: [{ spec: "After-sales support", detail: "OEM backed maintenance" }],
    },
    images: [
      {
        url: PRODUCT_IMAGE,
        cloudinary_id: "figma-admin-product-image",
        isDefault: true,
        originalName: "digital-xray-system.svg",
      },
    ],
    description:
      "High-resolution digital X-ray imaging system configured for diagnostic centres and hospital procurement teams.",
    availability_status: "in_stock",
    installation_time: "2 weeks",
    delivery_time: "30/09/2025 (1 week)",
    return_policy: "Standard warranty and return policy applies.",
    sku: "DX-900",
    certifications: [],
    oemApprovalStatus: "approved",
    hasOemBadge: true,
    createdBy: {
      _id: "distributor-product-owner",
      firstName: "The name",
      lastName: "of distributor",
      email: "distributor.product@figmadiff.local",
      role: "distributor",
    },
    assignedOem: {
      _id: "oem-product-owner",
      firstName: "MedTech",
      lastName: "OEM",
      email: "oem.product@figmadiff.local",
      role: "oem",
    },
    status: index % 4 === 0 ? "pending" : "approved",
    submittedAt: "2026-04-01T09:00:00.000Z",
    createdAt: "2026-03-28T09:00:00.000Z",
    updatedAt: "2026-04-02T09:00:00.000Z",
  };
}

async function fulfillJson(route: import("@playwright/test").Route, data: unknown, message = "OK") {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(ok(message, data)),
  });
}

async function installAdminApiMocks(page: import("@playwright/test").Page) {
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const pathname = url.pathname.replace(/\/api\/v1/, "");
    const href = request.url();
    const isApiRequest =
      href.startsWith(API_BASE_URL) ||
      url.pathname.includes("/api/v1/") ||
      url.port === "4000";

    if (!isApiRequest) {
      await route.continue();
      return;
    }

    if (
      (href.includes("/auth/profile") || href.includes("/auth/me")) &&
      method === "GET"
    ) {
      await fulfillJson(route, { ...ADMIN_USER, tokens: undefined }, "Profile fetched successfully");
      return;
    }

    if (href.includes("/admin/dashboard-summary") && method === "GET") {
      await fulfillJson(route, buildDashboardSummary(), "Dashboard summary fetched");
      return;
    }

    if (href.includes("/admin/platform-users-summary") && method === "GET") {
      await fulfillJson(route, {
        approvedUsers: {
          total: 1208,
          buyers: 805,
          distributors: 203,
          oems: 95,
          engineers: 85,
          agents: 20,
        },
        onboardingRequests: {
          supported: false,
          total: 95,
          distributors: 40,
          oems: 25,
          engineers: 30,
        },
      });
      return;
    }

    if (href.includes("/admin/platform-users") && method === "GET") {
      await fulfillJson(route, paginated(platformUsers(url.searchParams.get("role"))));
      return;
    }

    if (pathname.match(/^\/products\/[^/]+$/) && method === "GET") {
      await fulfillJson(route, buildAdminProduct(), "Product fetched successfully");
      return;
    }

    if (pathname === "/products" && method === "GET") {
      await fulfillJson(
        route,
        {
          ...paginated(Array.from({ length: 8 }).map((_, index) => buildAdminProduct(index))),
          summary: {
            statusCounts: { draft: 0, pending: 3, approved: 5, rejected: 0 },
          },
        },
        "Products fetched successfully",
      );
      return;
    }

    if (href.includes("/admin/rfqs-orders-summary") && method === "GET") {
      await fulfillJson(route, {
        rfqs: { totalRequests: 305, totalQuotesSent: 213 },
        orders: {
          total: 208,
          createdPendingPayment: 18,
          cancelledPrePayment: 7,
          processing: 62,
          shipped: 81,
          deliveredCompleted: 40,
        },
      });
      return;
    }

    if (href.includes("/admin/rfqs") && method === "GET") {
      await fulfillJson(route, paginated(Array.from({ length: 8 }).map((_, index) => ({
        id: `rfq-${index + 1}`,
        distributorName: "The name of the distributor",
        productName: "The name of the product",
        quantity: 3 + index,
        unitPrice: 60028,
        totalPrice: 720056,
        deliveryTime: "24-48 hours",
        status: "pending",
        createdAt: "2026-04-01T09:00:00.000Z",
      }))));
      return;
    }

    if (href.includes("/admin/quotes") && method === "GET") {
      await fulfillJson(route, paginated(Array.from({ length: 8 }).map((_, index) => ({
        id: `quote-${index + 1}`,
        distributorName: "The name of the distributor",
        productName: "The name of the product",
        quantity: 3 + index,
        unitPrice: 60028,
        totalPrice: 720056,
        dateReceived: "2026-04-01T09:00:00.000Z",
        downloadUrl: "#",
      }))));
      return;
    }

    if (href.includes("/admin/orders") && method === "GET") {
      await fulfillJson(route, paginated(Array.from({ length: 8 }).map((_, index) => ({
        id: `order-${index + 1}`,
        distributorName: "The name of the distributor",
        productName: "The name of the product",
        quantity: 3 + index,
        unitPrice: 60028,
        totalPrice: 720056,
        date: "2026-04-01T09:00:00.000Z",
        status: "processing",
      }))));
      return;
    }

    if (href.includes("/kyc/admin/stats") && method === "GET") {
      await fulfillJson(route, {
        totalVerifiedUsers: 25,
        pendingKycReviews: 5,
        rejectedSubmissions: 10,
        verificationFlagged: 12,
      });
      return;
    }

    if (href.includes("/kyc/admin/submissions/") && method === "GET") {
      await fulfillJson(route, {
        _id: "kyc-1",
        userId: "user-1",
        userRole: "buyer",
        tierKey: "basic_buyer",
        tierLabel: "Basic Buyer",
        status: "submitted",
        requestStatusLabel: "Pending",
        user: {
          _id: "user-1",
          firstName: "The name",
          lastName: "of the user",
          email: "kyc.user@figmadiff.local",
          role: "Buyer",
          displayPhoto: null,
        },
        reviewer: null,
        documents: [
          {
            fieldName: "nationalId",
            fileName: "national-id.pdf",
            fileType: "application/pdf",
            fileUrl: "#",
            cloudinaryId: "figma-national-id",
            uploadedAt: "2026-04-01T09:00:00.000Z",
          },
        ],
        textFields: { countryOfOrigin: "Nigeria", address: "12 Marina Road, Lagos" },
        rejectionReason: null,
        reviewedBy: null,
        reviewedAt: null,
        submittedAt: "2026-04-01T09:00:00.000Z",
        createdAt: "2026-03-28T09:00:00.000Z",
        updatedAt: "2026-04-01T09:00:00.000Z",
      });
      return;
    }

    if (href.includes("/kyc/admin/submissions") && method === "GET") {
      await fulfillJson(route, paginated(Array.from({ length: 8 }).map((_, index) => ({
        _id: `kyc-${index + 1}`,
        fullName: "Samuel Smart",
        email: `kyc${index + 1}@figmadiff.local`,
        avatarUrl: null,
        kycLevel: "Basic seller",
        documentSubmitted: "3/3",
        role: "Seller",
        status: index % 3 === 0 ? "Pending" : "Approved",
        registrationDate: "2026-04-01T09:00:00.000Z",
        createdAt: "2026-04-01T09:00:00.000Z",
      }))));
      return;
    }

    void pathname;
    await route.continue();
  });
}

function expectedTextFor(entry: FrameMapEntry): string | RegExp {
  if (entry.slug?.startsWith("dashboard")) {
    return /Revenue Analysis|User Onboarding Analysis|Total number of users|Top 10 Products/i;
  }
  if (entry.slug === "platform-user-distributor-detail") {
    return /Emmanuella Ifeanyi|Distributor|Operations|Suspend Account/i;
  }
  if (entry.slug === "platform-user-agent-detail") {
    return /MRI \(Magnetic Resonance Imaging\)|Key Specifications|Product status/i;
  }
  if (entry.slug?.startsWith("platform-users")) {
    return /Total platform users|All Buyers|All Distributors|All OEMs|All Agents|Service Engineers|Onboarding Request/i;
  }
  if (entry.slug?.startsWith("products")) return /Products|Listings/i;
  if (entry.slug?.startsWith("product-detail")) return /Product Details|Product detail|Description/i;
  if (entry.slug === "rfq-detail") return /Order Details|Order Status|Distributor's name/i;
  if (entry.slug?.startsWith("rfqs-orders")) return /RFQs|Orders|Quotes/i;
  if (entry.slug === "settings-2fa-authenticator-qr") return /Setup 2FA with authenticator app/i;
  if (entry.slug?.startsWith("settings")) return /Settings|Security|Audit|Preferences/i;
  if (entry.slug === "user-management-add-user") return /Add a New User/i;
  if (entry.slug?.startsWith("user-management")) return /User Management|All Admin Users|Roles/i;
  if (entry.slug === "services-engineer-detail") {
    return /Subscription|Samuel Smart|All available plans|Extend plan/i;
  }
  if (entry.slug?.startsWith("services")) return /Service|Request/i;
  if (entry.slug === "payment-invoice-detail") return /Resolution summary|Invoice ID/i;
  if (entry.slug === "payment-escrow-detail") return /Invoice Details|Reverse Escrow|Under dispute/i;
  if (entry.slug?.startsWith("payment")) return /Payment|Escrow/i;
  if (entry.slug?.startsWith("disputes")) return /Disputes|Resolution/i;
  if (entry.slug?.startsWith("subscriptions")) return /Subscription|Subscribers/i;
  if (entry.slug?.startsWith("kyc")) return /KYC|Verification/i;
  if (entry.slug?.startsWith("profile")) return /Profile|Personal|Account|Notification/i;
  return /./;
}

async function waitForAdminContent(
  page: import("@playwright/test").Page,
  entry: FrameMapEntry,
) {
  const expectedText = expectedTextFor(entry);
  await page.waitForFunction(
    ({ source, flags, text }) => {
      const bodyText = document.body.innerText;
      return source
        ? new RegExp(source, flags).test(bodyText)
        : bodyText.includes(text ?? "");
    },
    typeof expectedText === "string"
      ? { text: expectedText }
      : { source: expectedText.source, flags: expectedText.flags },
    { timeout: 15000 },
  );
  await page.waitForFunction(() => {
    const bodyText = document.body.innerText.trim();
    const hasOnlySpinner =
      bodyText.length === 0 || Boolean(document.querySelector(".animate-spin"));
    return !hasOnlySpinner;
  }, null, { timeout: 15000 });
}

async function applyState(page: import("@playwright/test").Page, entry: FrameMapEntry) {
  if (entry.state === "click-tab" && entry.stateParams?.tab) {
    await page.getByText(entry.stateParams.tab, { exact: true }).first().click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
  }

  if (entry.state === "open-first-row-detail") {
    await page.getByRole("button", { name: /view|details/i }).first().click({ timeout: 5000 }).catch(async () => {
      await page.getByLabel(/view/i).first().click({ timeout: 5000 }).catch(() => {});
    });
    await page.waitForTimeout(800);
  }
}

const mapped = loadMappedEntries();

test.describe("Super Admin Portal - Figma diff screenshots", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      (args: string[]) => {
        const [key, value] = args;
        window.localStorage.setItem(key, value);
      },
      [AUTH_SESSION_STORAGE_KEY, JSON.stringify(ADMIN_USER)],
    );
    await installAdminApiMocks(page);
  });

  for (const entry of mapped) {
    const { slug, viewport } = entry as Required<FrameMapEntry>;

    test(`admin | ${viewport} | ${slug} - ${entry.route}`, async ({ page }) => {
      const outDir = path.join(OUT_BASE, String(viewport));
      await fs.promises.mkdir(outDir, { recursive: true });

      const width = viewport as number;
      const height = entry.slug === "rfq-detail" ? 1000 : width <= 420 ? 812 : 900;
      await page.setViewportSize({ width, height });

      await page.goto(entry.route!, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.evaluate(() => document.fonts.ready);
      await page.addStyleTag({
        content: `
          nextjs-portal,
          [data-nextjs-toast],
          [data-nextjs-dialog-overlay],
          [data-nextjs-dialog] {
            display: none !important;
            visibility: hidden !important;
            pointer-events: none !important;
          }
        `,
      });
      await applyState(page, entry);
      await waitForAdminContent(page, entry);
      await page.waitForTimeout(800);

      await page.screenshot({
        path: path.join(outDir, `${slug}.png`),
        fullPage: entry.viewport !== 500,
      });
    });
  }
});
