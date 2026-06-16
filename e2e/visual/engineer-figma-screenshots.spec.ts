/**
 * Captures full-page screenshots of engineer dashboard routes for visual comparison
 * against docs/figma/B2B Market Place Service Engineer/*.png
 *
 * Run: npx playwright test e2e/visual/engineer-figma-screenshots.spec.ts
 * Then: node scripts/compare-engineer-figma.mjs
 */
import fs from "node:fs";
import path from "node:path";

import { test } from "@playwright/test";

import { installBaseApi, seedSession } from "../helpers/engineer-session-mock";

const OUT_DIR = path.join(process.cwd(), "test-results", "engineer-figma", "actual");

const CAPTURES: { route: string; file: string }[] = [
  { route: "/dashboard/engineer", file: "dashboard.png" },
  { route: "/dashboard/engineer/job-requests", file: "job-requests.png" },
  { route: "/dashboard/engineer/wallet", file: "wallet.png" },
  { route: "/dashboard/engineer/profile", file: "profile.png" },
  { route: "/dashboard/engineer/kyc-verification", file: "kyc-verification.png" },
  { route: "/dashboard/engineer/messaging", file: "messaging.png" },
  { route: "/dashboard/engineer/subscription", file: "subscription.png" },
];

test.describe("Engineer routes — Figma comparison screenshots", () => {
  test.beforeEach(async ({ page }) => {
    await seedSession(page, "engineer");
    await installBaseApi(page, { role: "engineer" });
  });

  for (const { route, file } of CAPTURES) {
    test(`capture ${file}`, async ({ page }) => {
      await fs.promises.mkdir(OUT_DIR, { recursive: true });
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle");
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(800);
      const outPath = path.join(OUT_DIR, file);
      await page.screenshot({ path: outPath, fullPage: true });
    });
  }
});
