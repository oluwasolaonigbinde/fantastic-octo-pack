#!/usr/bin/env node
/**
 * Pixel-diff Playwright screenshots (test-results/engineer-figma/actual/*.png)
 * against Figma exports (docs/figma/B2B Market Place Service Engineer/*.png).
 *
 * Both images are normalized to the same canvas (fit: contain) before comparison.
 *
 * Usage (from baiy-web): node scripts/compare-engineer-figma.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baiyWeb = path.join(__dirname, "..");
const repoRoot = path.join(baiyWeb, "..", "..");
const figmaDir = path.join(repoRoot, "docs", "figma", "B2B Market Place Service Engineer");
const actualDir = path.join(baiyWeb, "test-results", "engineer-figma", "actual");
const reportDir = path.join(baiyWeb, "test-results", "engineer-figma", "diff-report");

/** Matches `e2e/visual/engineer-figma-screenshots.spec.ts` output names → Figma filenames */
const PAIRS = [
  { actual: "dashboard.png", figma: "Engineer Dashboard.png" },
  { actual: "job-requests.png", figma: "Engineer - Job Requests.png" },
  { actual: "wallet.png", figma: "Engineer - Wallet.png" },
  {
    actual: "profile.png",
    figma: "Service  Engineer - My Profile - Personal Information.png",
  },
  { actual: "kyc-verification.png", figma: "Service Engineer - KYC Verification.png" },
];

const CANVAS_W = 1440;
const CANVAS_H = 12000;
const BG = { r: 245, g: 247, b: 250, alpha: 1 };

async function toRgbaCanvas(imagePath) {
  const { data, info } = await sharp(imagePath)
    .resize(CANVAS_W, CANVAS_H, {
      fit: "contain",
      position: "north",
      background: BG,
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info.width !== CANVAS_W || info.height !== CANVAS_H) {
    throw new Error(`Unexpected dimensions ${info.width}x${info.height} for ${imagePath}`);
  }

  return new Uint8Array(data);
}

function writeDiffPng(diffBuf, width, height, outPath) {
  const png = new PNG({ width, height });
  png.data.set(diffBuf);
  fs.writeFileSync(outPath, PNG.sync.write(png));
}

async function comparePair(actualName, figmaName) {
  const actualPath = path.join(actualDir, actualName);
  const figmaPath = path.join(figmaDir, figmaName);

  if (!fs.existsSync(actualPath)) {
    return { actualName, figmaName, skipped: true, reason: `missing actual: ${actualPath}` };
  }
  if (!fs.existsSync(figmaPath)) {
    return { actualName, figmaName, skipped: true, reason: `missing figma: ${figmaPath}` };
  }

  const a = await toRgbaCanvas(actualPath);
  const b = await toRgbaCanvas(figmaPath);
  const diff = new Uint8Array(CANVAS_W * CANVAS_H * 4);
  const mismatched = pixelmatch(a, b, diff, CANVAS_W, CANVAS_H, {
    threshold: 0.15,
    includeAA: false,
  });
  const total = CANVAS_W * CANVAS_H;
  const pct = ((mismatched / total) * 100).toFixed(2);

  const base = path.basename(actualName, ".png");
  fs.mkdirSync(reportDir, { recursive: true });
  const diffPath = path.join(reportDir, `${base}-diff.png`);
  writeDiffPng(diff, CANVAS_W, CANVAS_H, diffPath);

  return {
    actualName,
    figmaName,
    skipped: false,
    mismatchedPixels: mismatched,
    totalPixels: total,
    diffPercent: Number(pct),
    diffPath,
  };
}

async function main() {
  console.log("Figma dir:", figmaDir);
  console.log("Actual dir:", actualDir);
  console.log("Report dir:", reportDir);
  console.log("Canvas:", CANVAS_W, "x", CANVAS_H, "(contain + pad)\n");

  const rows = [];
  for (const { actual, figma } of PAIRS) {
    rows.push(await comparePair(actual, figma));
  }

  const summaryPath = path.join(reportDir, "summary.txt");
  const lines = [];
  for (const r of rows) {
    if (r.skipped) {
      const line = `SKIP ${r.actualName} vs ${r.figmaName}: ${r.reason}`;
      console.log(line);
      lines.push(line);
      continue;
    }
    const line = `${r.actualName} vs ${r.figmaName}: ${r.diffPercent}% pixels differ (${r.mismatchedPixels}/${r.totalPixels}) — diff: ${r.diffPath}`;
    console.log(line);
    lines.push(line);
  }

  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(summaryPath, lines.join("\n"), "utf8");
  console.log("\nWrote", summaryPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
