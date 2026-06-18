/**
 * Figma vs Implementation — Agent Portal capture spec
 *
 * Reads docs/visual-alignment/frame-map.agent.json at runtime.
 * For every "mapped" entry, captures a screenshot at the specified viewport.
 * Outputs to: visual-results/figma-diff/actual/agent/{viewport}/{slug}.png
 *
 * Run (with existing .next build):
 *   PLAYWRIGHT_BASE_URL=http://localhost:3100 npx playwright test e2e/visual/figma-sync-agent.spec.ts
 *
 * Or via runner:
 *   node scripts/run-local-e2e.mjs --mode frontend-only -- e2e/visual/figma-sync-agent.spec.ts
 *
 * This spec does NOT modify existing snapshot baselines and does NOT touch
 * Buyer/Distributor/Engineer visual-alignment workflow files.
 */
import fs from "node:fs";
import path from "node:path";

import { test } from "@playwright/test";

// ─── Auth session key ──────────────────────────────────────────────────────────
const AUTH_SESSION_STORAGE_KEY = "baiy.auth.session";
const LOCAL_ROLE_AUTH_STORAGE_KEY = "baiy.localRoleAuth.user";
const LOCAL_ROLE_AUTH_ENABLED_STORAGE_KEY = "baiy.localRoleAuth.enabled";

// ─── Mock agent user ──────────────────────────────────────────────────────────

const AGENT_USER = {
  _id: "figma-diff-agent-user",
  firstName: "Otor",
  lastName: "John Stephen",
  email: "otorjohnst@gmail.com",
  phoneNumber: "08130000000",
  address: "No 38 Ashiek Jarma Street, Opposite AA Rano fuel Station, Nasarawa State",
  role: "agent",
  status: "active",
  isEmailVerified: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  tokens: {
    accessToken: "figma-diff-agent-access-token-placeholder",
    refreshToken: "figma-diff-agent-refresh-token-placeholder",
  },
};

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
  state?: "route" | "route-with-query" | "open-mobile-sidebar";
  stateParams?: Record<string, string>;
  notes?: string;
}

const FRAME_MAP_PATH = path.join(
  process.cwd(),
  "..",
  "..",
  "docs",
  "visual-alignment",
  "frame-map.agent.json",
);

function loadMappedEntries(): FrameMapEntry[] {
  const raw = fs.readFileSync(FRAME_MAP_PATH, "utf8");
  const all: FrameMapEntry[] = JSON.parse(raw);
  const slugPattern = process.env.AGENT_FIGMA_SLUG_PATTERN
    ? new RegExp(process.env.AGENT_FIGMA_SLUG_PATTERN, "i")
    : null;

  return all.filter(
    (e) =>
      e.status === "mapped" &&
      e.route !== null &&
      e.viewport !== null &&
      e.slug !== null &&
      (!slugPattern || slugPattern.test(e.slug) || slugPattern.test(e.figmaFrameName)),
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
  "agent",
);

// ─── API mock installer ───────────────────────────────────────────────────────

async function installAgentApiMocks(page: import("@playwright/test").Page) {
  await page.route("**/api/v1/**", async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    const ok = (message: string, data: unknown) => ({ success: true, message, data });

    // Auth profile — return mock agent user
    if (
      (url.includes("/auth/profile") || url.includes("/auth/me")) &&
      method === "GET"
    ) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("Profile fetched successfully", { ...AGENT_USER, tokens: undefined }),
        ),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(ok("Mocked agent visual endpoint", null)),
    });
  });
}

function expectedTextFor(entry: FrameMapEntry): string | RegExp {
  const slug = entry.slug ?? "";

  if (slug === "mobile-sidebar-open") return /Dashboard|Business Owners|Orders|Wallet|Training/i;
  if (slug.startsWith("dashboard")) return /Dashboard|Agent Dashboard|Gold Level Agent|Total Business Owners|Revenue/i;
  if (slug.startsWith("business-owner") && slug.includes("catalogue-new")) return /Add Product|Product|Category|Pricing|Stock|Images/i;
  if (slug.startsWith("business-owner") && slug.includes("catalogue")) return /Product|Catalogue|Edit product|Add Product|Category|MRI|OEM Branding/i;
  if (slug.startsWith("business-owners") && slug.includes("catalogue-new")) return /Add Product|Product|Category|Pricing|Stock|Images/i;
  if (slug.startsWith("business-owners") && slug.includes("catalogue")) return /Product catalogue|Catalogue|Product Details|Add Product/i;
  if (slug.startsWith("business-owner") && slug.includes("subscription")) return /Subscription|Plan|Payment/i;
  if (slug.startsWith("business-owner") && slug.includes("dispute")) return /Dispute|Resolution|Order/i;
  if (slug.startsWith("business-owner") && slug.includes("escrow")) return /Escrow|Order|Amount/i;
  if (slug.startsWith("business-owner") && slug.includes("order")) return /Orders|Order Details|Delivery|Buyer/i;
  if (slug.startsWith("business-owner") && slug.includes("kyc")) return /KYC|Business|Verification|Tier/i;
  if (slug.startsWith("business-owner")) return /Business|KYC|Orders|Catalogue|Subscription/i;
  if (slug.startsWith("orders") || slug.startsWith("order-detail")) return /Orders|Order Details|Delivery|Product/i;
  if (slug.startsWith("escrow")) return /Escrow|Order|Amount|Status/i;
  if (slug.startsWith("wallet")) return /Wallet|Earnings|Withdraw|Balance/i;
  if (slug.startsWith("training")) return /Training|Courses|Learning/i;
  if (slug.startsWith("profile")) return /Profile|Personal|Password|Notification/i;
  if (slug.startsWith("notifications")) return /Notifications|Notification/i;
  if (slug.startsWith("add-business-owner")) return /Add Business|Business Owner|Successful/i;
  if (slug === "submission-error") return /error|required|failed|Add Product/i;
  if (slug === "password-error") return /Password|error|incorrect|Profile/i;

  return /Dashboard|Business|Orders|Escrow|Wallet|Profile|Notifications/i;
}

async function waitForAgentContent(
  page: import("@playwright/test").Page,
  entry: FrameMapEntry,
) {
  const expectedText = expectedTextFor(entry);

  await page.waitForFunction(
    ({ source, flags, text }) => {
      const bodyText = document.body.innerText;
      if (/This page couldn.t load|Reload to try again|Application error|Log in|Sign in/i.test(bodyText)) {
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

  await page.waitForFunction(() => {
    const bodyText = document.body.innerText.trim();
    return bodyText.length > 0 && !document.querySelector(".animate-spin");
  }, null, { timeout: 15000 });
}

async function hideDevOverlays(page: import("@playwright/test").Page) {
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
}

// ─── Tests ────────────────────────────────────────────────────────────────────

const mapped = loadMappedEntries();

test.describe("Agent Portal — Figma diff screenshots", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      ([sessionKey, roleUserKey, roleEnabledKey, val]: string[]) => {
        window.localStorage.setItem(sessionKey, val);
        window.localStorage.setItem(roleUserKey, val);
        window.localStorage.setItem(roleEnabledKey, "1");
      },
      [
        AUTH_SESSION_STORAGE_KEY,
        LOCAL_ROLE_AUTH_STORAGE_KEY,
        LOCAL_ROLE_AUTH_ENABLED_STORAGE_KEY,
        JSON.stringify(AGENT_USER),
      ],
    );
    await installAgentApiMocks(page);
  });

  for (const entry of mapped) {
    const { slug, viewport } = entry as Required<FrameMapEntry>;
    const url = buildUrl(entry);

    test(`agent | ${viewport} | ${slug} — ${url}`, async ({ page }) => {
      test.setTimeout(60_000);

      const outDir = path.join(OUT_BASE, String(viewport));
      await fs.promises.mkdir(outDir, { recursive: true });

      const vp = viewport as number;
      const viewportHeight = vp <= 420 ? 812 : 900;
      await page.setViewportSize({ width: vp, height: viewportHeight });

      // business-owner-detail at mobile viewport needs a pre-warm navigation
      // to /dashboard/agent so that dashboard/layout.tsx completes its auth
      // hydration before we navigate to the 4-level deep dynamic route.
      if (slug === "business-owner-detail" && vp <= 420) {
        await page.goto("/dashboard/agent", { waitUntil: "domcontentloaded" });
        await page.waitForSelector("main", { timeout: 8000 }).catch(() => {});
      }

      await page.goto(url, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle", { timeout: 3000 }).catch(() => {});
      await page.evaluate(() => document.fonts.ready);
      await hideDevOverlays(page);

      if (entry.state === "open-mobile-sidebar") {
        await page
          .getByRole("button", { name: /open navigation menu/i })
          .click({ timeout: 8000 });
      }

      await waitForAgentContent(page, entry);
      await page.waitForTimeout(1200);

      const outPath = path.join(outDir, `${slug}.png`);
      if (slug === "submission-error") {
        await page.getByTestId("submission-error-modal").screenshot({ path: outPath });
        return;
      }

      await page.screenshot({ path: outPath, fullPage: entry.state !== "open-mobile-sidebar" });
    });
  }
});
