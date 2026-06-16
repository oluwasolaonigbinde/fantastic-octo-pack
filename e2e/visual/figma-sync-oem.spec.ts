/**
 * Figma vs Implementation — OEM Portal capture spec
 *
 * Reads docs/visual-alignment/frame-map.oem.json at runtime.
 * Outputs: visual-results/figma-diff/actual/oem/{viewport}/{slug}.png
 *
 * Run:
 *   node scripts/run-local-e2e.mjs --mode frontend-only -- e2e/visual/figma-sync-oem.spec.ts
 *
 * Reference PNGs (gitignored): figma-ref/oem/{360|1440}/{slug}.png
 * Compare: node scripts/compare-figma-to-impl.mjs --batch oem
 *
 * Figma source: design/0xXkEn3M43wt9eUGO2U9IY (B2B-Market-Place). Node IDs in frame-map.oem.json.
 */
import fs from "node:fs";
import path from "node:path";

import { test } from "@playwright/test";

const AUTH_SESSION_STORAGE_KEY = "baiy.auth.session";

const API_BASE_URL =
  process.env.PLAYWRIGHT_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000/api/v1";

const OEM_DETAIL_ID = "oem-listing-detail-figma";

const OEM_USER = {
  _id: "figma-diff-oem-user",
  firstName: "Acme",
  lastName: "Medical OEM",
  email: "oem.figmadiff@local.test",
  phoneNumber: "+2348099911223",
  address: "17 Admiralty Way, Lekki Phase 1, Lagos",
  role: "oem",
  status: "active",
  isEmailVerified: true,
  dateOfBirth: "1988-06-15T00:00:00.000Z",
  displayPhoto: {
    url: "/placeholder.svg",
    cloudinary_id: "figma-oem-avatar",
  },
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  tokens: {
    accessToken: "figma-diff-oem-access-token-placeholder",
    refreshToken: "figma-diff-oem-refresh-token-placeholder",
  },
};

const DIST_A = {
  _id: "oem-mock-dist-a",
  firstName: "Chioma",
  lastName: "Okonkwo",
  email: "chioma.okonkwo@medsupply.ng",
  phoneNumber: "+2348012345678",
  displayPhoto: { url: "/placeholder.svg", cloudinary_id: "mock-a" },
};

const DIST_B = {
  _id: "oem-mock-dist-b",
  firstName: "Ibrahim",
  lastName: "Hassan",
  email: "ibrahim.hassan@northmed.ng",
  phoneNumber: "+2348087654321",
  displayPhoto: { url: "/placeholder.svg", cloudinary_id: "mock-b" },
};

/** Minimal product shape for OEM pages + mocked API JSON */
interface MockProduct {
  _id: string;
  name: string;
  category: string;
  sub_category?: string;
  brand_oem?: string;
  manufacturing_country?: string;
  condition: "new" | "used" | "refurbished";
  quantityAvailable?: number;
  priceMode?: "fixed" | "negotiable";
  pricePerUnit: number;
  pricing_type?: "fixed" | "negotiable" | "rfq";
  unit_of_measure?: string;
  countries?: string[];
  isRfqAvailable?: boolean;
  keySpecifications?: string;
  key_attributes?: unknown;
  images: Array<{ url: string; cloudinary_id: string; isDefault: boolean }>;
  description?: string;
  availability_status?: "in_stock" | "out_of_stock" | "on_order";
  installation_time?: string;
  delivery_time?: string;
  return_policy?: string;
  sku?: string;
  oemApprovalStatus: "not_requested" | "pending" | "approved" | "rejected";
  hasOemBadge?: boolean;
  visibilityRejectionReason?: string;
  oemRejectionReason?: string;
  createdBy: typeof DIST_A | typeof DIST_B;
  assignedOem?: string;
  status: "draft" | "pending" | "approved" | "rejected";
  submittedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

const heroImage = (url: string, id: string): MockProduct["images"] => [
  { url, cloudinary_id: id, isDefault: true },
];

const baseProduct = (
  partial: Partial<MockProduct> & Pick<MockProduct, "_id" | "name">,
): MockProduct => ({
  name: partial.name,
  _id: partial._id,
  category: partial.category ?? "Medical Equipment",
  sub_category: partial.sub_category,
  brand_oem: partial.brand_oem ?? "Philips",
  manufacturing_country: partial.manufacturing_country ?? "Netherlands",
  condition: partial.condition ?? "new",
  quantityAvailable: partial.quantityAvailable ?? 4,
  priceMode: partial.priceMode ?? "fixed",
  pricePerUnit: partial.pricePerUnit ?? 125000,
  pricing_type: partial.pricing_type ?? "fixed",
  unit_of_measure: partial.unit_of_measure ?? "unit",
  countries: partial.countries ?? ["Nigeria"],
  isRfqAvailable: partial.isRfqAvailable ?? false,
  keySpecifications:
    partial.keySpecifications ??
    "Power: 110-240V\nWarranty: 24 months\nWeight: 85kg",
  key_attributes: partial.key_attributes,
  images: partial.images ?? heroImage("/placeholder.svg", "p-img"),
  description:
    partial.description ??
    "Diagnostic imaging system suitable for mid-size clinics. Includes calibration toolkit.",
  availability_status: partial.availability_status ?? "in_stock",
  installation_time: partial.installation_time ?? "2 weeks",
  delivery_time: partial.delivery_time ?? "4 weeks",
  return_policy: partial.return_policy ?? "Standard OEM return policy",
  sku: partial.sku ?? "PH-ULT-001",
  oemApprovalStatus: partial.oemApprovalStatus ?? "pending",
  hasOemBadge: partial.hasOemBadge,
  visibilityRejectionReason: partial.visibilityRejectionReason,
  oemRejectionReason: partial.oemRejectionReason,
  createdBy: partial.createdBy ?? DIST_A,
  assignedOem: partial.assignedOem ?? OEM_USER._id,
  status: partial.status ?? "pending",
  submittedAt: partial.submittedAt ?? "2026-04-10T09:30:00.000Z",
  createdAt: partial.createdAt ?? "2026-04-10T09:00:00.000Z",
  updatedAt: partial.updatedAt ?? "2026-04-12T11:00:00.000Z",
});

/** Spread across weekdays for bar chart buckets */
const MOCK_OEM_PRODUCTS: MockProduct[] = [
  baseProduct({
    _id: "oem-prod-001",
    name: "Ultrasound Convex Probe",
    createdBy: DIST_A,
    oemApprovalStatus: "pending",
    status: "pending",
    category: "Medical consumables kit",
    submittedAt: "2026-04-21T10:00:00.000Z",
  }),
  baseProduct({
    _id: "oem-prod-002",
    name: "Patient Monitor MX400",
    createdBy: DIST_A,
    oemApprovalStatus: "approved",
    status: "approved",
    submittedAt: "2026-04-22T14:20:00.000Z",
  }),
  baseProduct({
    _id: "oem-prod-003",
    name: "Portable X-Ray Unit",
    createdBy: DIST_B,
    oemApprovalStatus: "pending",
    status: "pending",
    submittedAt: "2026-04-23T08:15:00.000Z",
  }),
  baseProduct({
    _id: "oem-prod-004",
    name: "Ventilator Servo Module",
    createdBy: DIST_B,
    oemApprovalStatus: "approved",
    status: "approved",
    category: "Consumables",
    submittedAt: "2026-04-24T16:45:00.000Z",
  }),
  baseProduct({
    _id: "oem-prod-005",
    name: "ECG Cable Set",
    createdBy: DIST_B,
    oemApprovalStatus: "rejected",
    status: "rejected",
    oemRejectionReason: "Incomplete certification documents.",
    submittedAt: "2026-04-25T11:00:00.000Z",
  }),
  baseProduct({
    _id: OEM_DETAIL_ID,
    name: "MRI Coil Assembly 16ch",
    createdBy: DIST_A,
    oemApprovalStatus: "pending",
    status: "pending",
    pricePerUnit: 890000,
    submittedAt: "2026-04-26T09:30:00.000Z",
    keySpecifications:
      "Channels: 16\nField strength: 1.5T compatible\nWeight: 4.2kg",
    description:
      "Replacement coil assembly for 1.5T imaging suite. OEM packaging; inspection sticker required before install.",
    images: heroImage("/placeholder.svg", "coil-hero"),
  }),
];

const MOCK_OEM_DETAIL: MockProduct =
  MOCK_OEM_PRODUCTS.find((p) => p._id === OEM_DETAIL_ID) ??
  baseProduct({ _id: OEM_DETAIL_ID, name: "MRI Coil Assembly 16ch" });

const OEM_KYC_TIERS = [
  {
    tierKey: "oem_tier_1",
    routeSlug: "tier-1",
    tierLabel: "Tier 1",
    tierOrdinal: 1,
    processingTime: null as string | null,
    isAutoGranted: true,
    submissionBehavior: "none" as const,
    requiredTextFields: [] as Array<{
      fieldName: string;
      label: string;
      inputType: "text" | "dropdown";
      options?: string[];
    }>,
    requiredDocuments: [] as Array<{ fieldName: string; label: string }>,
    detailTitle: "Account verified",
    detailSubtitle: "Automatically granted for OEM accounts.",
    badgeLabel: "Tier 1",
  },
  {
    tierKey: "oem_tier_2",
    routeSlug: "tier-2",
    tierLabel: "Tier 2",
    tierOrdinal: 2,
    processingTime: "3–5 business days",
    isAutoGranted: false,
    submissionBehavior: "review_required" as const,
    requiredTextFields: [
      {
        fieldName: "manufacturerReg",
        label: "Manufacturer registration number",
        inputType: "text" as const,
      },
    ],
    requiredDocuments: [
      { fieldName: "qualityIso", label: "ISO quality certificate (PDF)" },
    ],
    detailTitle: "Manufacturer documentation",
    detailSubtitle: "Required for expanded listing privileges.",
    badgeLabel: "Tier 2",
  },
];

const ok = (message: string, data: unknown) => ({
  success: true,
  message,
  data,
});

const buildProductListPayload = () => ({
  docs: MOCK_OEM_PRODUCTS,
  page: 1,
  limit: 20,
  hasNextPage: false,
  hasPreviousPage: false,
  nextPage: null,
  previousPage: null,
  totalDocs: MOCK_OEM_PRODUCTS.length,
  totalPages: 1,
});

const emptyPaginated = () => ({
  docs: [] as unknown[],
  page: 1,
  limit: 10,
  hasNextPage: false,
  hasPreviousPage: false,
  nextPage: null,
  previousPage: null,
  totalDocs: 0,
  totalPages: 0,
});

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

function loadMappedEntries(): FrameMapEntry[] {
  const resolved = path.join(
    process.cwd(),
    "..",
    "..",
    "docs",
    "visual-alignment",
    "frame-map.oem.json",
  );
  const raw = fs.readFileSync(resolved, "utf8");
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

const OUT_BASE = path.join(process.cwd(), "visual-results", "figma-diff", "actual", "oem");

async function installOemApiMocks(page: import("@playwright/test").Page) {
  await page.route(`${API_BASE_URL}/**`, async (route) => {
    const url = route.request().url();
    const method = route.request().method();
    const pathname = new URL(url).pathname;

    if (
      (url.includes("/auth/profile") || url.includes("/auth/me")) &&
      method === "GET"
    ) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("Profile fetched successfully", {
            ...OEM_USER,
            tokens: undefined,
          }),
        ),
      });
      return;
    }

    if (url.includes("/kyc/tiers") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Tiers loaded", OEM_KYC_TIERS)),
      });
      return;
    }

    if (url.includes("/kyc/submissions") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Submissions loaded", [])),
      });
      return;
    }

    if (url.includes("/kyc/upload") && method === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("Upload received", {
            fileUrl: "https://example.com/mock-doc.pdf",
            cloudinaryId: "mock-doc",
            fileName: "document.pdf",
            fileType: "application/pdf",
          }),
        ),
      });
      return;
    }

    if (url.includes("/kyc/submissions") && method === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("Submission created", {
            _id: "kyc-sub-mock",
            userId: OEM_USER._id,
            userRole: "oem",
            tierKey: "oem_tier_2",
            tierLabel: "Tier 2",
            status: "submitted",
            textFields: {},
            documents: [],
            rejectionReason: null,
            reviewedBy: null,
            reviewedAt: null,
            submittedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        ),
      });
      return;
    }

    const productDetailMatch = pathname.match(/\/products\/([^/]+)$/);
    if (productDetailMatch && method === "GET") {
      const id = productDetailMatch[1];
      const doc = MOCK_OEM_PRODUCTS.find((p) => p._id === id) ?? MOCK_OEM_DETAIL;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Product fetched", doc)),
      });
      return;
    }

    if (pathname.endsWith("/products") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Products fetched", buildProductListPayload())),
      });
      return;
    }

    if (pathname.match(/\/products\/[^/]+\/review/) && method === "PATCH") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Review recorded", MOCK_OEM_DETAIL)),
      });
      return;
    }

    if (
      (url.includes("/messages") || url.includes("/conversations")) &&
      method === "GET"
    ) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Messages fetched", emptyPaginated())),
      });
      return;
    }

    if (
      (url.includes("/users/me") || url.includes("/users/profile")) &&
      method === "GET"
    ) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("User fetched", { ...OEM_USER, tokens: undefined }),
        ),
      });
      return;
    }

    if (url.includes("/notifications") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Notifications fetched", emptyPaginated())),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, message: "ok", data: null }),
    });
  });
}

const mappedEntries = loadMappedEntries();

test.describe("OEM Portal — Figma diff screenshots", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      ([key, val]) => window.localStorage.setItem(key, val),
      [AUTH_SESSION_STORAGE_KEY, JSON.stringify(OEM_USER)],
    );
    await installOemApiMocks(page);
  });

  for (const entry of mappedEntries) {
    const { viewport, slug, route } = entry;
    const label = `oem | ${viewport} | ${slug} — ${route}`;

    test(label, async ({ page }) => {
      await page.setViewportSize({ width: viewport!, height: 900 });

      const url = buildUrl(entry);
      await page.goto(url, { waitUntil: "domcontentloaded" });

      await page.waitForLoadState("networkidle").catch(() => {});
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1000);

      const outDir = path.join(OUT_BASE, String(viewport));
      fs.mkdirSync(outDir, { recursive: true });

      const outPath = path.join(outDir, `${slug}.png`);
      await page.screenshot({ path: outPath, fullPage: true });
    });
  }
});
