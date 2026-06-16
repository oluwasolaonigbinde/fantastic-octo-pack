#!/usr/bin/env node
/**
 * BUIY — Figma vs Implementation pixel-diff + HTML report
 *
 * Reads docs/visual-alignment/frame-map.{batch}.json
 * Compares figma-ref/{role}/{viewport}/{slug}.png  (Figma reference)
 *     vs  visual-results/figma-diff/actual/{role}/{viewport}/{slug}.png  (Playwright capture)
 *
 * Outputs:
 *   visual-results/figma-diff/diffs/{role}/{viewport}/{slug}-diff.png
 *   visual-results/figma-diff/report.html
 *
 * Usage (from baiy-web/):
 *   node scripts/compare-figma-to-impl.mjs --batch buyer
 *   node scripts/compare-figma-to-impl.mjs --batch distributor
 *   node scripts/compare-figma-to-impl.mjs --batch engineer
 *   node scripts/compare-figma-to-impl.mjs --batch oem
 *
 * Thresholds:
 *   pass  < 2%
 *   warn  2-15%
 *   fail  > 15%
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

// ─── CLI args ─────────────────────────────────────────────────────────────────

function parseArgs() {
  const argv = process.argv.slice(2);
  const batchIdx = argv.indexOf("--batch");
  if (batchIdx === -1 || !argv[batchIdx + 1]) {
    throw new Error('Usage: node compare-figma-to-impl.mjs --batch <batchName>');
  }
  const onlyIdx = argv.indexOf("--only");
  return {
    batch: argv[batchIdx + 1],
    only: onlyIdx !== -1 ? argv[onlyIdx + 1] : null,
  };
}

// ─── Thresholds ───────────────────────────────────────────────────────────────

const THRESHOLD = { pass: 2, warn: 15 }; // percent
const PIXELMATCH_COLOR_THRESHOLD = 0.12;
function grade(pct, threshold = THRESHOLD) {
  if (pct < threshold.pass) return "pass";
  if (pct < threshold.warn) return "warn";
  return "fail";
}
const GRADE_COLORS = { pass: "#22c55e", warn: "#f59e0b", fail: "#ef4444" };
const GRADE_BG = { pass: "#f0fdf4", warn: "#fffbeb", fail: "#fef2f2" };
const STATUS_RANK = { pass: 0, warn: 1, fail: 2 };

// ─── Canvas normalization ─────────────────────────────────────────────────────

const BG = { r: 245, g: 247, b: 250, alpha: 1 };

async function getImageSize(imagePath) {
  const meta = await sharp(imagePath).metadata();
  return { width: meta.width, height: meta.height };
}

async function toRgbaCanvas(imagePath, canvasW, canvasH) {
  const { data, info } = await sharp(imagePath)
    .resize(canvasW, canvasH, {
      fit: "contain",
      position: "north",
      background: BG,
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info.width !== canvasW || info.height !== canvasH) {
    throw new Error(`Unexpected dimensions ${info.width}x${info.height} for ${imagePath}`);
  }

  return new Uint8Array(data);
}

function regionsForEntry(entry, canvasW, canvasH) {
  const clampH = (y, h) => Math.max(1, Math.min(h, canvasH - y));

  if (entry.viewport < 1000) {
    const regions = [
      { name: "mobile-first-viewport", x: 0, y: 0, w: canvasW, h: Math.min(canvasH, 812), pass: 1.5, warn: 3 },
      { name: "mobile-header", x: 0, y: 0, w: canvasW, h: Math.min(canvasH, 120), pass: 1, warn: 3 },
    ];

    if (canvasH > 120) {
      regions.push({
        name: "mobile-content-top",
        x: 0,
        y: 120,
        w: canvasW,
        h: clampH(120, 900),
        pass: 1.5,
        warn: 3,
      });
    }

    for (let y = 0; y < canvasH; y += 500) {
      regions.push({
        name: `mobile-slice-${String(y).padStart(4, "0")}`,
        x: 0,
        y,
        w: canvasW,
        h: Math.min(600, canvasH - y),
        pass: 3,
        warn: 6,
        skipBlank: true,
      });
    }

    return regions.filter((region) => region.h > 0);
  }

  const sidebarW = Math.min(250, canvasW);
  const contentX = sidebarW;
  const contentW = Math.max(1, canvasW - contentX);
  const viewportH = Math.min(canvasH, 900);

  return [
    { name: "viewport", x: 0, y: 0, w: canvasW, h: viewportH, pass: 3, warn: 4 },
    { name: "sidebar", x: 0, y: 0, w: sidebarW, h: viewportH, pass: 7, warn: 10 },
    { name: "topbar", x: contentX, y: 0, w: contentW, h: Math.min(104, canvasH), pass: 5, warn: 8 },
    {
      name: "content-top",
      x: contentX,
      y: Math.min(100, canvasH - 1),
      w: contentW,
      h: clampH(Math.min(100, canvasH - 1), 500),
      pass: 1.5,
      warn: 2,
    },
  ].filter((region) => region.h > 0);
}

function copyRegion(buf, canvasW, region) {
  const out = new Uint8Array(region.w * region.h * 4);
  for (let row = 0; row < region.h; row += 1) {
    const srcStart = ((region.y + row) * canvasW + region.x) * 4;
    const srcEnd = srcStart + region.w * 4;
    out.set(buf.subarray(srcStart, srcEnd), row * region.w * 4);
  }
  return out;
}

function blankPixelRatio(buf) {
  let blank = 0;
  const total = buf.length / 4;
  for (let offset = 0; offset < buf.length; offset += 4) {
    const r = buf[offset];
    const g = buf[offset + 1];
    const b = buf[offset + 2];
    if (
      (r >= 245 && g >= 245 && b >= 245) ||
      (Math.abs(r - BG.r) <= 3 && Math.abs(g - BG.g) <= 3 && Math.abs(b - BG.b) <= 3)
    ) {
      blank += 1;
    }
  }
  return total ? blank / total : 1;
}

function compareRegion(refBuf, actualBuf, canvasW, region) {
  const refRegion = copyRegion(refBuf, canvasW, region);
  const actualRegion = copyRegion(actualBuf, canvasW, region);
  const refBlankRatio = blankPixelRatio(refRegion);
  const actualBlankRatio = blankPixelRatio(actualRegion);

  if (region.skipBlank && refBlankRatio > 0.98 && actualBlankRatio > 0.98) {
    return {
      ...region,
      skipped: true,
      skipReason: "blank/background slice",
      refBlankRatio: Number(refBlankRatio.toFixed(4)),
      actualBlankRatio: Number(actualBlankRatio.toFixed(4)),
    };
  }

  const diffRegion = new Uint8Array(region.w * region.h * 4);
  const mismatchedPixels = pixelmatch(refRegion, actualRegion, diffRegion, region.w, region.h, {
    threshold: PIXELMATCH_COLOR_THRESHOLD,
    includeAA: false,
  });
  const totalPixels = region.w * region.h;
  const diffPercent = Number(((mismatchedPixels / totalPixels) * 100).toFixed(2));
  const status = grade(diffPercent, { pass: region.pass, warn: region.warn });

  return {
    ...region,
    skipped: false,
    mismatchedPixels,
    totalPixels,
    diffPercent,
    status,
  };
}

function worstRegion(regions) {
  return regions
    .filter((region) => !region.skipped)
    .sort((a, b) => {
      const statusDelta = STATUS_RANK[b.status] - STATUS_RANK[a.status];
      return statusDelta || b.diffPercent - a.diffPercent;
    })[0] ?? null;
}

function masksForEntry(entry) {
  if (entry.viewport !== 360) return [];

  if (entry.slug === "subscriptions") {
    return [
      // Metric values and subtitles are live data; keep card borders, titles, and icons visible.
      { x: 28, y: 138, w: 304, h: 240 },
      // CTA text/icon antialiasing differs by runtime font; keep button shape and placement visible.
      { x: 58, y: 481, w: 222, h: 32 },
      // Monthly subscription bars. Keep title, year control, axes, and legend visible.
      { x: 58, y: 830, w: 286, h: 230 },
      { x: 20, y: 830, w: 45, h: 250 },
      { x: 42, y: 676, w: 126, h: 34 },
      // Most purchased plan pies. Keep legends visible.
      { x: 58, y: 1222, w: 220, h: 220 },
      { x: 20, y: 1438, w: 230, h: 104 },
      { x: 58, y: 2694, w: 220, h: 220 },
      { x: 20, y: 2908, w: 230, h: 72 },
      // Subscriber rows are dynamic data. Keep heading, filters, CTA, and table header visible.
      { x: 42, y: 1676, w: 246, h: 34 },
      { x: 20, y: 2240, w: 340, h: 380 },
      // Expiry/renewal line plot area. Keep title, subtitle, year control, and legend visible.
      { x: 54, y: 3170, w: 306, h: 122 },
      { x: 20, y: 3170, w: 45, h: 122 },
      { x: 42, y: 3110, w: 246, h: 34 },
      // The Figma mobile frame clips the rest of the bottom chart at 3292px.
      { x: 0, y: 3292, w: 360, h: 300 },
    ];
  }

  if (entry.slug === "dashboard") {
    return [
      // User onboarding bars.
      { x: 58, y: 545, w: 286, h: 300 },
      // RFQ ratio pie, but not the title or legend.
      { x: 76, y: 998, w: 210, h: 210 },
    ];
  }

  return [];
}

function applyMasks(buf, canvasW, canvasH, masks) {
  for (const mask of masks) {
    const x1 = Math.max(0, Math.floor(mask.x));
    const y1 = Math.max(0, Math.floor(mask.y));
    const x2 = Math.min(canvasW, Math.ceil(mask.x + mask.w));
    const y2 = Math.min(canvasH, Math.ceil(mask.y + mask.h));

    for (let y = y1; y < y2; y += 1) {
      for (let x = x1; x < x2; x += 1) {
        const offset = (y * canvasW + x) * 4;
        buf[offset] = 255;
        buf[offset + 1] = 255;
        buf[offset + 2] = 255;
        buf[offset + 3] = 255;
      }
    }
  }
}

function writeDiffPng(diffBuf, width, height, outPath) {
  const png = new PNG({ width, height });
  png.data.set(diffBuf);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, PNG.sync.write(png));
}

async function toBase64(imagePath) {
  if (!fs.existsSync(imagePath)) return null;
  const buf = fs.readFileSync(imagePath);
  return `data:image/png;base64,${buf.toString("base64")}`;
}

// ─── Comparison ───────────────────────────────────────────────────────────────

async function compareEntry(entry, paths) {
  const { slug, viewport, role } = entry;

  if (!fs.existsSync(paths.ref)) {
    return { ...entry, skipped: true, skipReason: `missing reference: ${paths.ref}` };
  }
  if (!fs.existsSync(paths.actual)) {
    return { ...entry, skipped: true, skipReason: `missing actual: ${paths.actual}` };
  }

  const [refMeta, actualMeta] = await Promise.all([
    getImageSize(paths.ref),
    getImageSize(paths.actual),
  ]);
  const canvasW = viewport;
  const canvasH = Math.max(refMeta.height ?? 0, actualMeta.height ?? 0);

  const [refBuf, actualBuf] = await Promise.all([
    toRgbaCanvas(paths.ref, canvasW, canvasH),
    toRgbaCanvas(paths.actual, canvasW, canvasH),
  ]);
  const masks = masksForEntry(entry);
  applyMasks(refBuf, canvasW, canvasH, masks);
  applyMasks(actualBuf, canvasW, canvasH, masks);

  const diffBuf = new Uint8Array(canvasW * canvasH * 4);
  const mismatchedPixels = pixelmatch(refBuf, actualBuf, diffBuf, canvasW, canvasH, {
    threshold: PIXELMATCH_COLOR_THRESHOLD,
    includeAA: false,
  });

  const totalPixels = canvasW * canvasH;
  const visibleDiffPercent = Number(((mismatchedPixels / totalPixels) * 100).toFixed(2));
  const regions = regionsForEntry(entry, canvasW, canvasH)
    .map((region) => compareRegion(refBuf, actualBuf, canvasW, region));
  const worst = worstRegion(regions);
  const status = worst?.status ?? grade(visibleDiffPercent);
  const legacyDiffPercent = visibleDiffPercent;

  writeDiffPng(diffBuf, canvasW, canvasH, paths.diff);

  if (paths.metrics) {
    fs.mkdirSync(path.dirname(paths.metrics), { recursive: true });
    fs.writeFileSync(
      paths.metrics,
      JSON.stringify(
        {
          slug,
          route: entry.route,
          role,
          viewport,
          canvas: { width: canvasW, height: canvasH },
          sourceDimensions: { ref: refMeta, actual: actualMeta },
          legacyDiffPercent,
          visibleDiffPercent,
          status,
          worstRegion: worst
            ? {
                name: worst.name,
                diffPercent: worst.diffPercent,
                status: worst.status,
                mismatchedPixels: worst.mismatchedPixels,
                totalPixels: worst.totalPixels,
              }
            : null,
          regions,
          masksApplied: masks.length,
        },
        null,
        2,
      ),
      "utf8",
    );
  }

  return {
    ...entry,
    skipped: false,
    mismatchedPixels,
    totalPixels,
    diffPercent: visibleDiffPercent,
    visibleDiffPercent,
    legacyDiffPercent,
    status,
    canvas: { width: canvasW, height: canvasH },
    sourceDimensions: { ref: refMeta, actual: actualMeta },
    regions,
    worstRegion: worst,
    masksApplied: masks.length,
    paths,
  };
}

// ─── Divergence checklist ─────────────────────────────────────────────────────

function buildChecklist(result) {
  if (result.skipped || result.status === "pass") return null;

  return [
    { key: "layout_spacing", label: "Layout / spacing", desc: "gaps, padding, alignment, margin" },
    { key: "typography", label: "Typography", desc: "font size, weight, line-height, letter-spacing" },
    { key: "colors_borders_shadows", label: "Colors / borders / shadows", desc: "fill, stroke, elevation" },
    { key: "component_hierarchy", label: "Component hierarchy", desc: "wrong component, missing/extra wrapper" },
    { key: "missing_extra_ctas", label: "Missing or extra CTAs", desc: "button in Figma not in app, or vice versa" },
    { key: "wrong_labels_copy", label: "Wrong labels / copy", desc: "visible text differs (non-data)" },
    { key: "responsive_mobile", label: "Responsive / mobile", desc: "stacking order, drawer, overflow, tap targets" },
    { key: "dynamic_data_noise", label: "Dynamic data / image noise", desc: "real vs mock data, images, avatars — may be ignored" },
  ];
}

// ─── HTML report ──────────────────────────────────────────────────────────────

function buildRowHtml(result) {
  if (result.skipped) {
    return `
    <tr class="row-skipped" data-viewport="${result.viewport}" data-status="skip">
      <td class="route-cell"><code>${result.route ?? "—"}</code></td>
      <td>${result.slug}</td>
      <td>${result.viewport ?? "—"}</td>
      <td><span class="badge badge-skip">SKIP</span></td>
      <td colspan="6" style="color:#6b7280;font-size:12px">${result.skipReason}</td>
    </tr>`;
  }

  const bg = GRADE_BG[result.status];
  const color = GRADE_COLORS[result.status];
  const checklist = buildChecklist(result);

  const checklistHtml = checklist
    ? `<details class="checklist-details">
        <summary>Divergence checklist (${result.visibleDiffPercent ?? result.diffPercent}%)</summary>
        <ul class="checklist">
          ${checklist.map(item => `<li>
            <label>
              <input type="checkbox" data-key="${item.key}" />
              <strong>${item.label}</strong> — <span class="check-desc">${item.desc}</span>
            </label>
          </li>`).join("")}
        </ul>
        <div class="triage-note">
          <strong>Triage note:</strong>
          <textarea rows="2" placeholder="Notes for triage classification..."></textarea>
        </div>
      </details>`
    : "";

  return `
    <tr class="row-${result.status}" data-viewport="${result.viewport}" data-status="${result.status}" style="background:${bg}">
      <td class="route-cell"><code>${result.route}</code></td>
      <td>${result.slug}</td>
      <td>${result.viewport}</td>
      <td><span class="badge badge-${result.status}" style="background:${color}">${result.status.toUpperCase()}</span></td>
      <td>${result.visibleDiffPercent ?? result.diffPercent}%</td>
      <td>${result.worstRegion ? `${result.worstRegion.name} (${result.worstRegion.diffPercent}%)` : "â€”"}</td>
      <td>${result.legacyDiffPercent ?? result.diffPercent}%</td>
      <td class="img-cell">
        ${result.refSrc ? `<img src="${result.refSrc}" class="thumb" title="Figma reference" onclick="openModal(this)" />` : "<em>missing</em>"}
      </td>
      <td class="img-cell">
        ${result.actualSrc ? `<img src="${result.actualSrc}" class="thumb" title="App screenshot" onclick="openModal(this)" />` : "<em>missing</em>"}
      </td>
      <td class="img-cell">
        ${result.diffSrc ? `<img src="${result.diffSrc}" class="thumb diff-img" title="Pixel diff" onclick="openModal(this)" />` : "<em>no diff</em>"}
      </td>
    </tr>
    ${checklistHtml ? `<tr class="checklist-row" data-viewport="${result.viewport}" data-status="${result.status}">
      <td colspan="10">${checklistHtml}</td>
    </tr>` : ""}`;
}

function buildSectionHtml(title, rows, isMobile) {
  const sorted = [...rows].sort((a, b) =>
    a.skipped ? 1 : b.skipped ? -1 :
      (STATUS_RANK[b.status] - STATUS_RANK[a.status]) ||
      ((b.worstRegion?.diffPercent ?? b.diffPercent ?? 0) - (a.worstRegion?.diffPercent ?? a.diffPercent ?? 0))
  );

  const passCount = rows.filter(r => !r.skipped && r.status === "pass").length;
  const warnCount = rows.filter(r => !r.skipped && r.status === "warn").length;
  const failCount = rows.filter(r => !r.skipped && r.status === "fail").length;
  const skipCount = rows.filter(r => r.skipped).length;

  const sectionId = isMobile ? "mobile-section" : "desktop-section";
  const headerColor = isMobile ? "#1d4ed8" : "#374151";

  const worst5 = sorted.filter(r => !r.skipped && r.status !== "pass").slice(0, 5);
  const worst5Html = worst5.length
    ? `<div class="worst5">
        <strong>Top ${worst5.length} worst divergence${worst5.length > 1 ? "s" : ""}:</strong>
        <ol>${worst5.map(r => `<li><code>${r.route}</code> — ${r.slug} — <strong>${r.diffPercent}%</strong> (${r.status.toUpperCase()})</li>`).join("")}</ol>
      </div>`
    : "";

  return `
    <section id="${sectionId}">
      <h2 style="color:${headerColor};border-bottom:2px solid ${headerColor};padding-bottom:6px">
        ${title}
        <span class="viewport-label">${isMobile ? "Mobile (&lt;1000px, e.g. 360)" : "Desktop (1440px)"}</span>
      </h2>
      <div class="summary-bar">
        <span class="s-total">${rows.length} pairs</span>
        <span class="s-pass">✓ pass: ${passCount}</span>
        <span class="s-warn">⚠ warn: ${warnCount}</span>
        <span class="s-fail">✗ fail: ${failCount}</span>
        ${skipCount > 0 ? `<span class="s-skip">— skip: ${skipCount}</span>` : ""}
      </div>
      ${worst5Html}
      <table class="diff-table">
        <thead>
          <tr>
            <th>Route</th>
            <th>Slug</th>
            <th>Viewport</th>
            <th>Status</th>
            <th>Visible %</th>
            <th>Worst region</th>
            <th>Legacy %</th>
            <th>Figma ref</th>
            <th>App actual</th>
            <th>Pixel diff</th>
          </tr>
        </thead>
        <tbody>
          ${sorted.map(buildRowHtml).join("")}
        </tbody>
      </table>
    </section>`;
}

function buildHtmlReport(batch, results, date) {
  const mobile = results.filter(r => r.viewport < 1000);
  const desktop = results.filter(r => r.viewport >= 1000);

  const totalPass = results.filter(r => !r.skipped && r.status === "pass").length;
  const totalWarn = results.filter(r => !r.skipped && r.status === "warn").length;
  const totalFail = results.filter(r => !r.skipped && r.status === "fail").length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>BUIY — Figma vs Implementation Diff — ${batch}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 20px; background: #f9fafb; color: #111827; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  .meta { color: #6b7280; font-size: 13px; margin-bottom: 20px; }
  .filter-bar { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; align-items: center; }
  .filter-bar button { padding: 5px 12px; border: 1px solid #d1d5db; border-radius: 6px; background: white; cursor: pointer; font-size: 13px; }
  .filter-bar button.active { background: #1d4ed8; color: white; border-color: #1d4ed8; }
  .filter-bar label { font-size: 13px; color: #374151; margin-left: 10px; }
  .global-summary { display: flex; gap: 16px; padding: 16px; background: white; border-radius: 10px; margin-bottom: 24px; border: 1px solid #e5e7eb; }
  .g-stat { text-align: center; }
  .g-stat .val { font-size: 28px; font-weight: 700; }
  .g-stat .lbl { font-size: 12px; color: #6b7280; }
  section { margin-bottom: 40px; }
  h2 { font-size: 18px; margin-bottom: 12px; }
  .viewport-label { font-size: 13px; font-weight: normal; color: #6b7280; margin-left: 8px; }
  .summary-bar { display: flex; gap: 12px; margin-bottom: 12px; font-size: 14px; flex-wrap: wrap; }
  .s-total { color: #374151; font-weight: 600; }
  .s-pass { color: #16a34a; }
  .s-warn { color: #d97706; }
  .s-fail { color: #dc2626; }
  .s-skip { color: #9ca3af; }
  .worst5 { background: #fff7ed; border: 1px solid #fed7aa; padding: 12px 16px; border-radius: 8px; margin-bottom: 14px; font-size: 13px; }
  .worst5 ol { margin: 6px 0 0 16px; padding: 0; }
  .worst5 li { margin-bottom: 4px; }
  .diff-table { width: 100%; border-collapse: collapse; font-size: 13px; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; }
  .diff-table th { padding: 10px 12px; text-align: left; background: #f3f4f6; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
  .diff-table td { padding: 8px 12px; vertical-align: top; border-bottom: 1px solid #e5e7eb; }
  .route-cell code { font-size: 12px; background: #f3f4f6; padding: 2px 5px; border-radius: 4px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; color: white; }
  .badge-skip { background: #9ca3af; }
  .badge-pass { background: #22c55e; }
  .badge-warn { background: #f59e0b; }
  .badge-fail { background: #ef4444; }
  .img-cell { width: 130px; }
  .thumb { max-width: 120px; max-height: 120px; object-fit: contain; border: 1px solid #e5e7eb; border-radius: 4px; cursor: pointer; display: block; }
  .thumb:hover { opacity: 0.85; }
  .diff-img { border: 1px solid #fca5a5; }
  .checklist-row td { padding: 4px 12px 16px; background: #fafafa; border-bottom: 2px solid #e5e7eb; }
  .checklist-details summary { cursor: pointer; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 8px; }
  .checklist { list-style: none; margin: 8px 0 12px 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .checklist li label { display: flex; gap: 6px; align-items: flex-start; font-size: 13px; }
  .checklist li label input { margin-top: 2px; flex-shrink: 0; }
  .check-desc { color: #6b7280; }
  .triage-note { margin-top: 10px; }
  .triage-note strong { font-size: 12px; }
  .triage-note textarea { width: 100%; font-size: 12px; border: 1px solid #d1d5db; border-radius: 4px; padding: 6px; resize: vertical; margin-top: 4px; }
  /* Modal */
  #modal { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 1000; align-items: center; justify-content: center; padding: 20px; }
  #modal.open { display: flex; }
  #modal img { max-width: 90vw; max-height: 90vh; object-fit: contain; }
  #modal-close { position: fixed; top: 16px; right: 20px; color: white; font-size: 32px; cursor: pointer; z-index: 1001; }
  /* Hidden rows */
  .hidden { display: none !important; }
</style>
</head>
<body>
<h1>BUIY — Figma vs Implementation Diff</h1>
<p class="meta">Batch: <strong>${batch}</strong> &nbsp;|&nbsp; Date: ${date} &nbsp;|&nbsp; Total: ${results.length} pairs</p>

<div class="global-summary">
  <div class="g-stat"><div class="val" style="color:#374151">${results.length}</div><div class="lbl">Total</div></div>
  <div class="g-stat"><div class="val" style="color:#22c55e">${totalPass}</div><div class="lbl">Pass</div></div>
  <div class="g-stat"><div class="val" style="color:#f59e0b">${totalWarn}</div><div class="lbl">Warn</div></div>
  <div class="g-stat"><div class="val" style="color:#ef4444">${totalFail}</div><div class="lbl">Fail</div></div>
  <div class="g-stat"><div class="val" style="color:#1d4ed8">${mobile.length}</div><div class="lbl">Mobile</div></div>
  <div class="g-stat"><div class="val" style="color:#374151">${desktop.length}</div><div class="lbl">Desktop</div></div>
</div>

<div class="filter-bar">
  <strong>Filter:</strong>
  <button class="active" onclick="filterRows('all', this)">All</button>
  <button onclick="filterRows('mobile', this)">Mobile only</button>
  <button onclick="filterRows('1440', this)">Desktop only</button>
  <button onclick="filterRows('fail', this)">Fail only</button>
  <button onclick="filterRows('warn', this)">Warn only</button>
  <button onclick="filterRows('pass', this)">Pass only</button>
</div>

${buildSectionHtml("MOBILE SECTION", mobile, true)}
${buildSectionHtml("DESKTOP SECTION", desktop, false)}

<!-- Modal -->
<div id="modal" onclick="closeModal()">
  <span id="modal-close" onclick="closeModal()">×</span>
  <img id="modal-img" src="" />
</div>

<script>
function openModal(img) {
  document.getElementById('modal-img').src = img.src;
  document.getElementById('modal').classList.add('open');
  event.stopPropagation();
}
function closeModal() {
  document.getElementById('modal').classList.remove('open');
}

function filterRows(filter, btn) {
  document.querySelectorAll('.filter-bar button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const rows = document.querySelectorAll('tr[data-viewport], tr.checklist-row');
  rows.forEach(row => {
    const vp = row.getAttribute('data-viewport');
    const st = row.getAttribute('data-status');
    let show = false;
    if (filter === 'all') show = true;
    else if (filter === 'mobile') show = (Number(vp) < 1000);
    else if (filter === '1440') show = (Number(vp) >= 1000);
    else show = st === filter;
    row.classList.toggle('hidden', !show);
  });
}
</script>
</body>
</html>`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const { batch, only } = parseArgs();
  const frameMapPath = path.join(repoRoot, "docs", "visual-alignment", `frame-map.${batch}.json`);

  if (!fs.existsSync(frameMapPath)) {
    throw new Error(`Frame map not found: ${frameMapPath}`);
  }

  const frameMap = JSON.parse(fs.readFileSync(frameMapPath, "utf8"));
  const mapped = frameMap
    .filter(e => e.status === "mapped" && e.route && e.viewport && e.slug)
    .filter(e => !only || String(e.slug).includes(only) || String(e.viewport) === only);

  console.log(`\nBatch: ${batch} | Mapped entries: ${mapped.length}${only ? ` | only: ${only}` : ""}`);
  console.log("=".repeat(60));

  const refBase = path.join(baiyWeb, "figma-ref", batch);
  const actualBase = path.join(baiyWeb, "visual-results", "figma-diff", "actual", batch);
  const diffBase = path.join(baiyWeb, "visual-results", "figma-diff", "diffs", batch);
  const metricsBase = path.join(baiyWeb, "visual-results", "figma-diff", "metrics", batch);
  const reportPath = path.join(baiyWeb, "visual-results", "figma-diff", "report.html");

  const results = [];

  for (const entry of mapped) {
    const { slug, viewport, role } = entry;
    const vp = String(viewport);

    const paths = {
      ref: path.join(refBase, vp, `${slug}.png`),
      actual: path.join(actualBase, vp, `${slug}.png`),
      diff: path.join(diffBase, vp, `${slug}-diff.png`),
      metrics: path.join(metricsBase, vp, `${slug}.json`),
    };

    process.stdout.write(`  Comparing ${vp}px / ${slug} ... `);

    try {
      const result = await compareEntry(entry, paths);

      if (result.skipped) {
        console.log(`SKIP — ${result.skipReason}`);
      } else {
        const worstText = result.worstRegion
          ? ` | worst ${result.worstRegion.name}: ${result.worstRegion.diffPercent}%`
          : "";
        console.log(`${result.status.toUpperCase()} - visible ${result.visibleDiffPercent ?? result.diffPercent}%${worstText}`);

        const reportDir = path.dirname(reportPath);
        result.refSrc = path.relative(reportDir, paths.ref).replace(/\\/g, "/");
        result.actualSrc = path.relative(reportDir, paths.actual).replace(/\\/g, "/");
        result.diffSrc = path.relative(reportDir, paths.diff).replace(/\\/g, "/");
      }

      results.push(result);
    } catch (err) {
      console.log(`ERROR — ${err.message}`);
      results.push({
        ...entry,
        skipped: true,
        skipReason: `error: ${err.message}`,
      });
    }
  }

  console.log("\n" + "=".repeat(60));

  // Summary
  const mobile = results.filter(r => r.viewport < 1000);
  const desktop = results.filter(r => r.viewport >= 1000);

  const mobilePass = mobile.filter(r => !r.skipped && r.status === "pass").length;
  const mobileWarn = mobile.filter(r => !r.skipped && r.status === "warn").length;
  const mobileFail = mobile.filter(r => !r.skipped && r.status === "fail").length;
  const desktopPass = desktop.filter(r => !r.skipped && r.status === "pass").length;
  const desktopWarn = desktop.filter(r => !r.skipped && r.status === "warn").length;
  const desktopFail = desktop.filter(r => !r.skipped && r.status === "fail").length;

  console.log("\nMOBILE SUMMARY (<1000px viewport, e.g. 360px engineer)");
  console.log(`  ${mobile.length} pairs | pass: ${mobilePass}  warn: ${mobileWarn}  fail: ${mobileFail}`);
  const mobileWorst = mobile.filter(r => !r.skipped && r.status !== "pass")
    .sort((a, b) => (b.worstRegion?.diffPercent ?? b.diffPercent ?? 0) - (a.worstRegion?.diffPercent ?? a.diffPercent ?? 0)).slice(0, 5);
  if (mobileWorst.length) {
    console.log("  Top mobile divergences:");
    mobileWorst.forEach(r => console.log(`    ${r.diffPercent}% — ${r.slug} (${r.route})`));
  }

  console.log("\nDESKTOP SUMMARY (1440px)");
  console.log(`  ${desktop.length} pairs | pass: ${desktopPass}  warn: ${desktopWarn}  fail: ${desktopFail}`);
  const desktopWorst = desktop.filter(r => !r.skipped && r.status !== "pass")
    .sort((a, b) => (b.worstRegion?.diffPercent ?? b.diffPercent ?? 0) - (a.worstRegion?.diffPercent ?? a.diffPercent ?? 0)).slice(0, 5);
  if (desktopWorst.length) {
    console.log("  Top desktop divergences:");
    desktopWorst.forEach(r => console.log(`    ${r.diffPercent}% — ${r.slug} (${r.route})`));
  }

  // Batch-pass rule check
  const mobileFailing = mobile.filter(r => !r.skipped && (r.status === "warn" || r.status === "fail"));
  const desktopFailing = desktop.filter(r => !r.skipped && (r.status === "warn" || r.status === "fail"));
  const failing = [...mobileFailing, ...desktopFailing];
  if (failing.length > 0) {
    process.exitCode = 1;
    console.log(`\n⚠  BATCH NOT PASSING — ${mobileFailing.length} mobile row(s) are warn/fail and require resolution.`);
  } else {
    console.log("\n✓  Mobile — all rows pass or skipped.");
  }

  // Write HTML report
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  const html = buildHtmlReport(batch, results, new Date().toISOString().split("T")[0]);
  fs.writeFileSync(reportPath, html, "utf8");
  console.log(`\nReport written: ${reportPath}`);

  return { results, mobilePass, mobileWarn, mobileFail, desktopPass, desktopWarn, desktopFail };
}

main().catch(err => {
  console.error(`\nError: ${err.message}`);
  process.exitCode = 1;
});
