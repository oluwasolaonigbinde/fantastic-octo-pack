/**
 * Figma vs Implementation — Service Engineer Portal capture spec (Batch 3)
 *
 * Reads docs/visual-alignment/frame-map.engineer.json at runtime.
 * For every "mapped" entry, captures a screenshot at the specified viewport.
 * Outputs to: visual-results/figma-diff/actual/engineer/{viewport}/{slug}.png
 *
 * Supported states (frame-map `state` field):
 *   "route"            — navigate and capture full-page (default)
 *   "route-with-query" — navigate with stateParams as query string, capture full-page
 *
 * Run (frontend-only, default):
 *   node scripts/run-local-e2e.mjs --mode frontend-only -- e2e/visual/figma-sync-engineer.spec.ts
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

// ─── Mock engineer user ────────────────────────────────────────────────────────

const ENGINEER_USER = {
  _id: "figma-diff-engineer-user",
  firstName: "Tunde",
  lastName: "Adeyemi",
  email: "engineer.figmadiff@local.test",
  phoneNumber: "+2348055443322",
  address: "14 Victoria Island, Lagos",
  role: "engineer",
  status: "active",
  isEmailVerified: true,
  engineerTierLabel: "Tier 1",
  kycBadgeLabel: "KYC Verified",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  tokens: {
    accessToken: "figma-diff-engineer-access-token-placeholder",
    refreshToken: "figma-diff-engineer-refresh-token-placeholder",
  },
};

// ─── Mock service request data ────────────────────────────────────────────────

const MOCK_SERVICE_REQUEST_PENDING = {
  _id: "sr-JI23456",
  jobType: "Installation",
  equipmentName: "Philips Ultrasound Machine",
  brand: "Philips",
  model: "Resolution EVO",
  serviceLocation: "St. Mary's Hospital, 123 Medical Center Dr, Los Angeles, CA",
  preferredDate: "2026-02-03T08:00:00.000Z",
  preferredTime: "Morning (8:00 AM - 12:00 PM)",
  serviceDescription:
    "New CT scanner needs installation and calibration. Room is prepared with proper electrical setup and cooling system.",
  photos: [
    {
      url: "/images/engineer-equipment-375.png",
      cloudinary_id: "figma-sample-equipment",
    },
  ],
  requester: {
    _id: "buyer-req-001",
    firstName: "Dr. Sarah",
    lastName: "Johnson",
    email: "dr.sarah@stmaryshospital.com",
    organization: "St. Mary's Hospital",
  },
  engineer: {
    _id: ENGINEER_USER._id,
    firstName: ENGINEER_USER.firstName,
    lastName: ENGINEER_USER.lastName,
  },
  status: "pending",
  disputeActive: false,
  createdAt: "2026-04-20T10:00:00.000Z",
  updatedAt: "2026-04-20T10:00:00.000Z",
};

const MOCK_SERVICE_REQUEST_ACCEPTED = {
  ...MOCK_SERVICE_REQUEST_PENDING,
  _id: "sr-JI23457",
  jobType: "Maintenance",
  equipmentName: "Philips Ultrasound Machine",
  brand: "Philips",
  model: "Resolution EVO",
  serviceLocation: "St. Mary's Hospital, 123 Medical Center Dr, Los Angeles, CA",
  preferredDate: "2026-02-03T08:00:00.000Z",
  preferredTime: "Morning (8:00 AM - 12:00 PM)",
  serviceDescription:
    "New CT scanner needs installation and calibration. Room is prepared with proper electrical setup and cooling system.",
  requester: {
    _id: "buyer-req-001",
    firstName: "Dr. Sarah",
    lastName: "Johnson",
    email: "dr.sarah@stmaryshospital.com",
    organization: "St. Mary's Hospital",
  },
  status: "accepted",
  price: 150000,
  unitPrice: 150000,
};

const MOCK_SERVICE_REQUEST_INPROGRESS = {
  ...MOCK_SERVICE_REQUEST_PENDING,
  _id: "sr-JI23458",
  jobType: "Repair",
  equipmentName: "Siemens Ventilator V500",
  brand: "Siemens",
  model: "SERVO-U",
  serviceLocation: "National Hospital, Abuja",
  preferredDate: "2026-04-25T08:00:00.000Z",
  preferredTime: "8:00 AM",
  serviceDescription: "Emergency repair of ventilator unit in ICU.",
  requester: {
    _id: "buyer-req-003",
    firstName: "Dr. Emeka",
    lastName: "Eze",
    email: "dr.emeka@nationalhospital.gov.ng",
    organization: "National Hospital",
  },
  status: "in_progress",
  price: 220000,
  unitPrice: 220000,
};

// ─── Mock data helpers ────────────────────────────────────────────────────────

const buildPaginated = <T,>(
  docs: T[],
  totalDocs = docs.length,
  statusCounts?: { total: number; pending: number; completed: number; rejected: number },
) => ({
  docs,
  page: 1,
  limit: 10,
  hasNextPage: false,
  hasPreviousPage: false,
  nextPage: null,
  previousPage: null,
  totalDocs,
  totalPages: 1,
  ...(statusCounts ? { statusCounts } : {}),
});

const ok = (message: string, data: unknown) => ({
  success: true,
  message,
  data,
});

/** Shared KPI shape; list payloads differ by engineer route (see frame-map). */
const ENGINEER_DASHBOARD_STATUS_COUNTS = {
  total: 325,
  pending: 125,
  completed: 5,
  rejected: 3,
} as const;

/** Job-requests frame uses the same aggregate KPI story; adjust here if Figma KPIs diverge. */
const ENGINEER_JOB_REQUESTS_STATUS_COUNTS = {
  total: 325,
  pending: 125,
  completed: 5,
  rejected: 3,
} as const;

/** Figma engineer dashboard recent jobs: three cards (pending, accepted, in progress). */
const DASHBOARD_SERVICE_REQUEST_DOCS = [
  MOCK_SERVICE_REQUEST_PENDING,
  MOCK_SERVICE_REQUEST_ACCEPTED,
  MOCK_SERVICE_REQUEST_INPROGRESS,
] as const;

/** Figma engineer job-requests mobile: two cards in the captured frame. */
const JOB_REQUESTS_SERVICE_REQUEST_DOCS = [
  MOCK_SERVICE_REQUEST_PENDING,
  MOCK_SERVICE_REQUEST_ACCEPTED,
] as const;

function engineerServiceRequestListContext(
  route: import("@playwright/test").Route,
): "dashboard" | "job-requests" | "other" {
  const req = route.request();
  const frameUrl = req.frame()?.url() ?? "";
  const headers = req.headers();
  const referer = headers["referer"] ?? headers["Referer"] ?? "";
  const combined = frameUrl || referer;
  try {
    const pathname = new URL(combined, "http://localhost").pathname.replace(/\/$/, "");
    if (pathname === "/dashboard/engineer") return "dashboard";
    if (pathname.endsWith("/dashboard/engineer/job-requests")) return "job-requests";
  } catch {
    /* ignore */
  }
  return "other";
}

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
  "frame-map.engineer.json",
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
  "engineer",
);

// ─── API mock installer ───────────────────────────────────────────────────────

async function installEngineerApiMocks(page: import("@playwright/test").Page) {
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
          ok("Profile fetched successfully", {
            ...ENGINEER_USER,
            tokens: undefined,
          }),
        ),
      });
      return;
    }

    // Service requests — engineer's assigned job list
    if (url.includes("/service-requests") && method === "GET") {
      const pathname = new URL(url).pathname;
      // Single request by ID
      if (pathname.match(/\/service-requests\/[^/]+$/)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(
            ok("Service request fetched", MOCK_SERVICE_REQUEST_INPROGRESS),
          ),
        });
        return;
      }
      // List — route-aware: dashboard shows 3 recent jobs; job-requests shows 2 (Figma frames).
      const ctx = engineerServiceRequestListContext(route);
      const docs =
        ctx === "dashboard"
          ? [...DASHBOARD_SERVICE_REQUEST_DOCS]
          : ctx === "job-requests"
            ? [...JOB_REQUESTS_SERVICE_REQUEST_DOCS]
            : [...JOB_REQUESTS_SERVICE_REQUEST_DOCS];
      const statusCounts =
        ctx === "dashboard"
          ? ENGINEER_DASHBOARD_STATUS_COUNTS
          : ENGINEER_JOB_REQUESTS_STATUS_COUNTS;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok(
            "Service requests fetched",
            buildPaginated(docs, 325, { ...statusCounts }),
          ),
        ),
      });
      return;
    }

    // KYC verification
    if (url.includes("/kyc") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("KYC data fetched", {
            status: "pending",
            tier: 1,
            submittedAt: null,
            approvedAt: null,
          }),
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
        body: JSON.stringify(ok("Messages fetched", buildPaginated([]))),
      });
      return;
    }

    // User profile / me
    if (
      (url.includes("/users/me") || url.includes("/users/profile")) &&
      method === "GET"
    ) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("User fetched", { ...ENGINEER_USER, tokens: undefined }),
        ),
      });
      return;
    }

    // Reviews
    if (url.includes("/reviews") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Reviews fetched", buildPaginated([]))),
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

    // Fallback — pass through or return 200 empty
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, message: "ok", data: null }),
    });
  });
}

// ─── Main test ────────────────────────────────────────────────────────────────

const mappedEntries = loadMappedEntries();

test.describe("Service Engineer Portal — Figma diff screenshots", () => {
  // Use the shared page fixture + beforeEach (same pattern as buyer/distributor specs)
  // so that page.addInitScript runs before every navigation.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      ([key, val]) => window.localStorage.setItem(key, val),
      [AUTH_SESSION_STORAGE_KEY, JSON.stringify(ENGINEER_USER)],
    );
    await installEngineerApiMocks(page);
  });

  for (const entry of mappedEntries) {
    const { viewport, slug, route } = entry;
    const label = `engineer | ${viewport} | ${slug} — ${route}`;

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
