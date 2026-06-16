/**
 * Upload surface audit — logs into each local QA role, exercises upload UIs where automatable,
 * hits API endpoints directly for format matrix, writes JSON + markdown report.
 *
 * Run from repo: cd buiy-frontend/baiy-web && node scripts/upload-surface-audit.mjs
 * Requires: frontend + API on PLAYWRIGHT_BASE_URL / PLAYWRIGHT_API_URL.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { File } from "node:buffer";
import { spawn } from "node:child_process";
import playwright from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(WEB_ROOT, "..", "..");
const ASSET_DIR = path.join(REPO_ROOT, ".upload-test");
const ACCOUNTS_PATH = path.join(REPO_ROOT, "scripts", "local-role-auth.manual.accounts.json");
/** Full narrative report is maintained in docs/upload-surface-audit-report.md; script writes JSON + a small generated stub. */
const REPORT_MD_STUB = path.join(REPO_ROOT, "docs", "upload-surface-audit-report.generated.md");
const REPORT_JSON = path.join(REPO_ROOT, "docs", "upload-surface-audit-result.json");
const LOG_DIR = path.join(REPO_ROOT, "tmp", "upload-surface-audit");
const FRONTEND_LOG = path.join(LOG_DIR, "frontend.log");

const API_ONLY = process.argv.includes("--api-only");
const DEFAULT_BASE_URL = "http://127.0.0.1:3100";
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || DEFAULT_BASE_URL;
/** Prefer 127.0.0.1 on Windows to avoid ::1 vs IPv4 listener mismatches. */
const API_URL = process.env.PLAYWRIGHT_API_URL || "http://127.0.0.1:4000/api/v1";
const NAV_TIMEOUT_MS = Number(process.env.UPLOAD_AUDIT_NAV_TIMEOUT_MS || 300000);
const FRONTEND_READY_TIMEOUT_MS = Number(
  process.env.UPLOAD_AUDIT_FRONTEND_READY_TIMEOUT_MS || 120000,
);
const FRONTEND_FETCH_TIMEOUT_MS = 5000;
const FRONTEND_WARM_PATHS = ["/", "/login", "/dashboard", "/dashboard/oem/requests"];
const shouldManageFrontend =
  !API_ONLY &&
  (process.env.UPLOAD_AUDIT_MANAGE_FRONTEND === "1" ||
    (!process.env.PLAYWRIGHT_BASE_URL &&
      process.env.UPLOAD_AUDIT_MANAGE_FRONTEND !== "0"));

const FORMATS = ["png", "jpg", "jpeg", "pdf", "docx", "csv"];
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

/** Minimal 1x1 JPEG (base64) */
const MIN_JPEG_B64 =
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAr/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGfAP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//Z";

function ensureAssets() {
  fs.mkdirSync(ASSET_DIR, { recursive: true });
  const pngB64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const pngPath = path.join(ASSET_DIR, "minimal.png");
  if (!fs.existsSync(pngPath)) {
    fs.writeFileSync(pngPath, Buffer.from(pngB64, "base64"));
  }
  const jpgPath = path.join(ASSET_DIR, "minimal.jpg");
  if (!fs.existsSync(jpgPath)) {
    fs.writeFileSync(jpgPath, Buffer.from(MIN_JPEG_B64, "base64"));
  }
  const jpegPath = path.join(ASSET_DIR, "minimal.jpeg");
  if (!fs.existsSync(jpegPath)) {
    fs.copyFileSync(jpgPath, jpegPath);
  }
  const pdfPath = path.join(ASSET_DIR, "minimal.pdf");
  if (!fs.existsSync(pdfPath)) {
    fs.writeFileSync(pdfPath, "%PDF-1.1\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF", "ascii");
  }
  const csvPath = path.join(ASSET_DIR, "minimal.csv");
  if (!fs.existsSync(csvPath)) {
    fs.writeFileSync(
      csvPath,
      "product_name,quantity,distributor_email\nTest Product,1,distributor@local.test\n",
      "utf8",
    );
  }
  const docxPath = path.join(ASSET_DIR, "sample.docx");
  if (!fs.existsSync(docxPath)) {
    const candidate = path.join(REPO_ROOT, "docs", "Document 10 (1).docx");
    if (fs.existsSync(candidate)) {
      fs.copyFileSync(candidate, docxPath);
    }
  }
}

function readAccounts() {
  const raw = JSON.parse(fs.readFileSync(ACCOUNTS_PATH, "utf8"));
  return raw;
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function createChildEnv(extra = {}) {
  const env = {};

  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === "string") {
      env[key] = value;
    }
  }

  return {
    ...env,
    ...extra,
  };
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function isFrontendReady(url) {
  try {
    const response = await fetchWithTimeout(url, FRONTEND_FETCH_TIMEOUT_MS);
    await response.arrayBuffer();
    return response.ok;
  } catch {
    return false;
  }
}

function runForegroundCommand(label, command, args, env) {
  console.log(`[upload-audit] ${label}`);

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: WEB_ROOT,
      env,
      stdio: "inherit",
      windowsHide: true,
    });

    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `${label} failed with ${signal ? `signal ${signal}` : `exit code ${code}`}.`,
        ),
      );
    });
  });
}

function readTail(filePath, lineCount = 40) {
  if (!fs.existsSync(filePath)) {
    return "";
  }

  const lines = fs.readFileSync(filePath, "utf8").trim().split(/\r?\n/);
  return lines.slice(-lineCount).join("\n");
}

async function stopProcessTree(child) {
  if (!child?.pid) {
    return;
  }

  if (process.platform === "win32") {
    await new Promise((resolve) => {
      const killer = spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
        stdio: "ignore",
        windowsHide: true,
      });

      killer.once("exit", resolve);
      killer.once("error", resolve);
    });
    return;
  }

  child.kill("SIGTERM");
}

async function waitForFrontend(url, child) {
  const deadline = Date.now() + FRONTEND_READY_TIMEOUT_MS;
  let lastError = null;

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      const logTail = readTail(FRONTEND_LOG);
      throw new Error(
        `Managed frontend exited before it became ready.${logTail ? `\n\nRecent frontend log:\n${logTail}` : ""}`,
      );
    }

    try {
      const response = await fetchWithTimeout(url, FRONTEND_FETCH_TIMEOUT_MS);
      await response.arrayBuffer();

      if (response.ok) {
        return;
      }

      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await delay(1000);
  }

  const detail = lastError instanceof Error ? lastError.message : String(lastError || "");
  throw new Error(`Timed out waiting for managed frontend at ${url}.${detail ? ` Last error: ${detail}` : ""}`);
}

async function warmFrontend(baseUrl) {
  for (const routePath of FRONTEND_WARM_PATHS) {
    const url = new URL(routePath, baseUrl).toString();
    const startedAt = Date.now();
    const response = await fetchWithTimeout(url, NAV_TIMEOUT_MS);
    await response.arrayBuffer();

    if (!response.ok) {
      throw new Error(`Warm-up failed for ${url}: HTTP ${response.status}`);
    }

    console.log(`[upload-audit] Warmed ${routePath} in ${Date.now() - startedAt}ms.`);
  }
}

async function ensureFrontendReady() {
  const loginUrl = new URL("/login", BASE_URL).toString();

  if (await isFrontendReady(loginUrl)) {
    console.log(`[upload-audit] Reusing frontend at ${BASE_URL}.`);
    return null;
  }

  if (!shouldManageFrontend) {
    throw new Error(
      `Frontend is not reachable at ${BASE_URL}. Start Next there, set PLAYWRIGHT_BASE_URL to the real origin, or unset PLAYWRIGHT_BASE_URL so this audit can manage ${DEFAULT_BASE_URL}.`,
    );
  }

  const base = new URL(BASE_URL);

  if (!["127.0.0.1", "localhost"].includes(base.hostname)) {
    throw new Error(
      `Refusing to manage non-local frontend origin ${BASE_URL}. Start it yourself or use a local PLAYWRIGHT_BASE_URL.`,
    );
  }

  const env = createChildEnv({
    NEXT_PUBLIC_API_URL: API_URL,
    NEXT_PUBLIC_ENABLE_LOCAL_ROLE_AUTH: "1",
  });

  if (process.env.UPLOAD_AUDIT_SKIP_FRONTEND_BUILD !== "1") {
    await runForegroundCommand("Building frontend for upload audit", npmCommand, ["run", "build"], env);
  }

  fs.mkdirSync(LOG_DIR, { recursive: true });
  const logStream = fs.createWriteStream(FRONTEND_LOG, { flags: "w" });
  const child = spawn(
    process.execPath,
    [
      path.join(WEB_ROOT, "node_modules", "next", "dist", "bin", "next"),
      "start",
      "--hostname",
      base.hostname,
      "--port",
      base.port || "3100",
    ],
    {
      cwd: WEB_ROOT,
      env,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    },
  );

  child.stdout.pipe(logStream, { end: false });
  child.stderr.pipe(logStream, { end: false });
  child.once("close", () => logStream.end());

  try {
    await waitForFrontend(loginUrl, child);
    console.log(`[upload-audit] Managed frontend ready at ${BASE_URL}. Logs: ${FRONTEND_LOG}`);
    await warmFrontend(BASE_URL);
    return child;
  } catch (error) {
    await stopProcessTree(child);
    throw error;
  }
}

async function apiLogin(email, password) {
  const r = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j?.data?.tokens?.accessToken) {
    throw new Error(j?.message || `login failed ${r.status}`);
  }
  return j.data;
}

async function apiMultipart(token, urlPath, fieldName, filePath, mimeType) {
  const buf = fs.readFileSync(filePath);
  const name = path.basename(filePath);
  const base = API_URL.replace(/\/$/, "");
  const fullUrl = urlPath.startsWith("http")
    ? urlPath
    : `${base}/${urlPath.replace(/^\//, "")}`;
  const form = new FormData();
  form.append(
    fieldName,
    new File([buf], name, { type: mimeType || "application/octet-stream" }),
  );
  const res = await fetch(fullUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const text = await res.text();
  let body = text;
  try {
    body = JSON.parse(text);
  } catch {
    /* keep text */
  }
  return { status: res.status, body };
}

function assetPath(fmt) {
  const map = {
    png: "minimal.png",
    jpg: "minimal.jpg",
    jpeg: "minimal.jpeg",
    pdf: "minimal.pdf",
    docx: "sample.docx",
    csv: "minimal.csv",
  };
  const f = map[fmt];
  if (!f) return null;
  const p = path.join(ASSET_DIR, f);
  return fs.existsSync(p) ? p : null;
}

/**
 * Avoid native <form> GET submits (RHF + Playwright fill can leave the browser on
 * /login?email=...). We authenticate via API, then persist the same local auth payload
 * used by normal login and local role fixtures.
 * Navigates to `/dashboard/:role` (lighter than `/dashboard` root) with `commit` to survive slow dev servers.
 */
async function uiLogin(page, email, password) {
  const user = await apiLogin(email, password);
  const sessionUser = {
    ...user,
    isEmailVerified: true,
  };
  const role = typeof user.role === "string" ? user.role : "buyer";
  await page.goto(`${BASE_URL}/login`, { waitUntil: "commit", timeout: NAV_TIMEOUT_MS });
  await page.evaluate((payload) => {
    localStorage.setItem("baiy.auth.session", JSON.stringify(payload));
    localStorage.setItem("baiy.localRoleAuth.user", JSON.stringify(payload));
    localStorage.setItem("baiy.localRoleAuth.enabled", "1");
  }, sessionUser);
  await page.goto(`${BASE_URL}/dashboard/${role}`, { waitUntil: "commit", timeout: NAV_TIMEOUT_MS });
  await page.waitForURL(new RegExp(`/dashboard/${role.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`), {
    timeout: NAV_TIMEOUT_MS,
  });
}

async function testProfilePhotoFormats(page, profileUrl, inputSelector) {
  const rows = [];
  for (const fmt of ["png", "jpg", "jpeg", "pdf", "docx"]) {
    const p = assetPath(fmt);
    if (!p) {
      rows.push({ format: fmt, worked: false, reason: "missing test asset", apiStatus: null, apiPath: null });
      continue;
    }
    const captured = [];
    const handler = (res) => {
      const u = res.url();
      if (u.includes("display-photo")) {
        captured.push({ url: u, status: res.status() });
      }
    };
    page.on("response", handler);
    await page.goto(profileUrl, { waitUntil: "domcontentloaded", timeout: 120000 });
    await page.waitForTimeout(2500);
    const input = page.locator(inputSelector).first();
    const inputCount = await page.locator(inputSelector).count();

    if (inputCount === 0) {
      page.off("response", handler);
      const bodyText = await page.locator("body").innerText().catch(() => "");
      rows.push({
        format: fmt,
        worked: false,
        reason: `input ${inputSelector} not found at ${page.url()}; body="${bodyText.slice(0, 180)}"`,
        apiStatus: null,
        apiPath: null,
      });
      continue;
    }

    const errBefore = await page.locator("text=/Only PNG|Only \\.png|File size|less than|Unable to upload|Invalid/i").count();
    await input.setInputFiles(p);
    await page.waitForTimeout(4500);
    page.off("response", handler);
    const hit = captured.find((c) => c.url.includes("display-photo"));
    const uiErr = await page.locator("text=/Only PNG|Only \\.png|File size|less than|Unable to upload|Invalid|JPG|JPEG/i").count();
    rows.push({
      format: fmt,
      worked: Boolean(hit && hit.status >= 200 && hit.status < 300),
      apiStatus: hit?.status ?? null,
      apiPath: hit ? "/auth/display-photo" : null,
      reason: hit
        ? null
        : uiErr > errBefore
          ? "client validation or error message (no successful API call)"
          : "no display-photo request observed (validation or silent)",
    });
  }
  return rows;
}

async function visitKycListPage(page, email, password, kycPath) {
  await uiLogin(page, email, password);
  await page.goto(`${BASE_URL}${kycPath}`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(5000);
  const fileInputs = await page.locator('input[type="file"]').count();
  const bodyLen = (await page.locator("body").innerText().catch(() => "")).length;
  return { fileInputs, bodyLen, loaded: bodyLen > 50 };
}

async function fillDistributorNewProductToImageStep(page) {
  await page.goto(`${BASE_URL}/dashboard/distributor/catalogue/new`, {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });
  await page.waitForTimeout(2000);
  await page.locator('[role="combobox"]').first().click();
  await page.waitForTimeout(300);
  await page.getByRole("option", { name: "Spare Parts" }).click();
  await page.locator('[role="combobox"]').nth(1).click();
  await page.waitForTimeout(300);
  await page.getByRole("option", { name: "Electrical Parts" }).click();
  await page.getByRole("button", { name: "Save & Continue" }).click();
  await page.waitForTimeout(2000);
  await page.getByPlaceholder("Enter name of product").fill(`Audit product ${Date.now()}`);
  await page.locator('[role="combobox"]').nth(1).click();
  await page.waitForTimeout(300);
  await page.locator('[role="option"]').first().click();
  await page.locator('[role="combobox"]').nth(2).click();
  await page.waitForTimeout(300);
  await page.locator('[role="option"]').first().click();
  await page.locator("textarea").first().fill("Audit upload test description.");
  await page.getByRole("button", { name: "Save & Continue" }).click();
  await page.waitForTimeout(2000);
  await page.locator('[role="combobox"]').first().click();
  await page.waitForTimeout(300);
  await page.locator('[role="option"]').first().click();
  await page.locator('input[type="number"]').nth(0).fill("1");
  await page.locator('input[type="number"]').nth(1).fill("2");
  await page.getByRole("button", { name: "Save & Continue" }).click();
  await page.waitForTimeout(2000);
  await page.locator('[role="combobox"]').nth(0).click();
  await page.waitForTimeout(300);
  await page.locator('[role="option"]').first().click();
  await page.locator('input[type="number"]').first().fill("100");
  await page.locator('[role="combobox"]').nth(1).click();
  await page.waitForTimeout(300);
  await page.locator('[role="option"]').first().click();
  await page.getByRole("button", { name: "Save & Continue" }).click();
  await page.waitForTimeout(3000);
}

async function main() {
  ensureAssets();
  const accounts = readAccounts();
  const results = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    apiUrl: API_URL,
    apiOnly: API_ONLY,
    surfaces: [],
    directApi: [],
  };

  /** -------- Direct API matrix (token from buyer) -------- */
  const buyerUser = await apiLogin(accounts.buyer.email, accounts.buyer.password);
  const token = buyerUser.tokens.accessToken;

  for (const fmt of ["png", "jpg", "pdf", "docx"]) {
    const p = assetPath(fmt);
    if (!p) continue;
    const mime =
      fmt === "png"
        ? "image/png"
        : fmt === "jpg"
          ? "image/jpeg"
          : fmt === "pdf"
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const r = await apiMultipart(token, "/auth/display-photo", "photo", p, mime);
    results.directApi.push({
      endpoint: "POST /auth/display-photo",
      format: fmt,
      status: r.status,
      ok: r.status >= 200 && r.status < 300,
      note:
        r.status >= 400
          ? (typeof r.body === "string" ? r.body : JSON.stringify(r.body)).slice(0, 240)
          : null,
    });
  }

  for (const fmt of ["png", "pdf", "docx"]) {
    const p = assetPath(fmt);
    if (!p) continue;
    const mime =
      fmt === "png"
        ? "image/png"
        : fmt === "pdf"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const r = await apiMultipart(token, "/kyc/upload", "file", p, mime);
    results.directApi.push({
      endpoint: "POST /kyc/upload",
      format: fmt,
      status: r.status,
      ok: r.status >= 200 && r.status < 300,
      note:
        r.status >= 400
          ? (typeof r.body === "string" ? r.body : JSON.stringify(r.body)).slice(0, 240)
          : null,
    });
  }

  if (API_ONLY) {
    fs.mkdirSync(path.dirname(REPORT_JSON), { recursive: true });
    fs.writeFileSync(REPORT_JSON, JSON.stringify(results, null, 2), "utf8");
    fs.writeFileSync(REPORT_MD_STUB, renderMarkdown(results), "utf8");
    console.log(`API-only: wrote ${REPORT_JSON} and ${REPORT_MD_STUB}`);
    console.log(`See docs/upload-surface-audit-report.md for the full human report.`);
    return;
  }

  const managedFrontend = await ensureFrontendReady();
  let browser = null;

  try {
    browser = await playwright.chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

  /** -------- Buyer profile UI -------- */
  await uiLogin(page, accounts.buyer.email, accounts.buyer.password);
  const buyerRows = await testProfilePhotoFormats(
    page,
    `${BASE_URL}/dashboard/buyer/profile`,
    "#profilePhoto",
  );
  results.surfaces.push({
    id: "buyer-profile-display-photo",
    route: "/dashboard/buyer/profile",
    role: "buyer",
    persistence: "User.displayPhoto.url via POST /auth/display-photo; shown in dashboard header avatar and PersonalDetails.",
    uiMatrix: buyerRows,
  });

  /** -------- Buyer KYC index (list; uploads usually in tier dialog) -------- */
  const buyerKyc = await visitKycListPage(
    page,
    accounts.buyer.email,
    accounts.buyer.password,
    "/dashboard/buyer/kyc-verification",
  );
  results.surfaces.push({
    id: "buyer-kyc-verification-index",
    route: "/dashboard/buyer/kyc-verification",
    role: "buyer",
    fileInputsOnPage: buyerKyc.fileInputs,
    pageLoaded: buyerKyc.loaded,
  });

  /** -------- Distributor profile (same PersonalDetails / #profilePhoto) -------- */
  await uiLogin(page, accounts.distributor.email, accounts.distributor.password);
  const distProfileRows = await testProfilePhotoFormats(
    page,
    `${BASE_URL}/dashboard/distributor/profile`,
    "#profilePhoto",
  );
  results.surfaces.push({
    id: "distributor-profile-display-photo",
    route: "/dashboard/distributor/profile",
    role: "distributor",
    uiMatrix: distProfileRows,
  });

  /** -------- Distributor KYC index -------- */
  const distKyc = await visitKycListPage(
    page,
    accounts.distributor.email,
    accounts.distributor.password,
    "/dashboard/distributor/kyc-verification",
  );
  results.surfaces.push({
    id: "distributor-kyc-verification-index",
    route: "/dashboard/distributor/kyc-verification",
    role: "distributor",
    fileInputsOnPage: distKyc.fileInputs,
    pageLoaded: distKyc.loaded,
  });

  /** -------- Distributor: store edit (PATCH distributor-store) — logo png vs docx -------- */
  await uiLogin(page, accounts.distributor.email, accounts.distributor.password);
  await page.goto(`${BASE_URL}/dashboard/distributor/store/edit`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(3000);
  for (const zone of [
    { id: "logo-upload", label: "store logo", field: "storeLogo" },
    { id: "cert-upload", label: "certification", field: "certifications" },
  ]) {
    for (const fmt of ["png", "docx"]) {
      const p = assetPath(fmt);
      if (!p) continue;
      const captured = [];
      const handler = (res) => {
        const u = res.url();
        if (u.includes("distributor-store") || u.includes("profile/distributor-store")) {
          captured.push({ url: u, status: res.status() });
        }
      };
      page.on("response", handler);
      await page.goto(`${BASE_URL}/dashboard/distributor/store/edit`, { waitUntil: "domcontentloaded", timeout: 120000 });
      await page.waitForTimeout(2000);
      await page.locator(`#${zone.id}`).setInputFiles(p);
      await page.waitForTimeout(500);
      await page.getByRole("button", { name: "Save Changes" }).click();
      await page.waitForTimeout(8000);
      page.off("response", handler);
      const hit = captured.find((c) => c.status > 0);
      results.surfaces.push({
        id: `distributor-store-${zone.id}-${fmt}`,
        route: "/dashboard/distributor/store/edit",
        role: "distributor",
        zone: zone.label,
        format: fmt,
        worked: Boolean(hit && hit.status >= 200 && hit.status < 300),
        apiStatus: hit?.status ?? null,
        persistence:
          "PATCH /auth/profile/distributor-store with multipart; Cloudinary URLs on DistributorStoreProfile; public distributor page uses store imagery when wired.",
      });
    }
  }

  /** -------- Distributor: new product image step + submit -------- */
  const productCaptured = [];
  const ph = (res) => {
    const u = res.url();
    if (u.includes("/api/v1/products") && !u.includes("submit")) {
      productCaptured.push({ url: u, status: res.status() });
    }
    if (u.includes("/products/") && u.includes("/submit")) {
      productCaptured.push({ url: u, status: res.status() });
    }
  };
  page.on("response", ph);
  await fillDistributorNewProductToImageStep(page);
  const accepts = await page.locator('input[type="file"]').evaluateAll((els) =>
    els.map((e) => ({ accept: e.getAttribute("accept"), id: e.id })),
  );
  await page.locator('input[type="file"]').first().setInputFiles(assetPath("png"));
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: "Submit" }).click();
  await page.waitForTimeout(12000);
  page.off("response", ph);
  const postProducts = productCaptured.filter((c) => c.url.includes("/products") && c.status === 201);
  const submitOk = productCaptured.some((c) => c.url.includes("/submit") && c.status === 200);
  results.surfaces.push({
    id: "distributor-add-product-images",
    route: "/dashboard/distributor/catalogue/new",
    role: "distributor",
    inputAccepts: accepts,
    pngProductCreateWorked: postProducts.length > 0,
    submitWorked: submitOk,
    persistence: "POST /products (multipart) then POST /products/:id/submit; images on Product in DB + Cloudinary.",
  });

  /** -------- OEM profile -------- */
  await uiLogin(page, accounts.oem.email, accounts.oem.password);
  const oemRows = await testProfilePhotoFormats(page, `${BASE_URL}/dashboard/oem/profile`, "#oem-profile-photo");
  results.surfaces.push({
    id: "oem-profile-display-photo",
    route: "/dashboard/oem/profile",
    role: "oem",
    persistence: "Same as buyer: POST /auth/display-photo; OEM header / profile card.",
    uiMatrix: oemRows,
  });

  const oemKyc = await visitKycListPage(
    page,
    accounts.oem.email,
    accounts.oem.password,
    "/dashboard/oem/kyc-verification",
  );
  results.surfaces.push({
    id: "oem-kyc-verification-index",
    route: "/dashboard/oem/kyc-verification",
    role: "oem",
    fileInputsOnPage: oemKyc.fileInputs,
    pageLoaded: oemKyc.loaded,
  });

  /** -------- Engineer profile (shared PersonalDetails) -------- */
  await uiLogin(page, accounts.engineer.email, accounts.engineer.password);
  const engRows = await testProfilePhotoFormats(
    page,
    `${BASE_URL}/dashboard/engineer/profile`,
    "#profilePhoto",
  );
  results.surfaces.push({
    id: "engineer-profile-display-photo",
    route: "/dashboard/engineer/profile",
    role: "engineer",
    persistence:
      "POST /auth/display-photo; public /service-engineers/profile?id=… uses engineer.displayPhoto.url in EngineerProfileCard.",
    uiMatrix: engRows,
  });

  const engKyc = await visitKycListPage(
    page,
    accounts.engineer.email,
    accounts.engineer.password,
    "/dashboard/engineer/kyc-verification",
  );
  results.surfaces.push({
    id: "engineer-kyc-verification-index",
    route: "/dashboard/engineer/kyc-verification",
    role: "engineer",
    fileInputsOnPage: engKyc.fileInputs,
    pageLoaded: engKyc.loaded,
  });

  /** -------- Admin: KYC management (review UI; uploads are user-side) -------- */
  await uiLogin(page, accounts.admin.email, accounts.admin.password);
  await page.goto(`${BASE_URL}/dashboard/admin/kyc-verification`, {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });
  await page.waitForTimeout(6000);
  const adminKycFiles = await page.locator('input[type="file"]').count();
  const adminKycText = await page.locator("body").innerText().catch(() => "");
  results.surfaces.push({
    id: "admin-kyc-verification",
    route: "/dashboard/admin/kyc-verification",
    role: "admin",
    fileInputsOnPage: adminKycFiles,
    pageLoaded: adminKycText.length > 30,
    note: "Admin reviews submissions; file inputs uncommon here.",
  });

  /** -------- Buyer RFQ bulk CSV -------- */
  await uiLogin(page, accounts.buyer.email, accounts.buyer.password);
  await page.goto(`${BASE_URL}/dashboard/buyer/rfqs`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(3000);
  await page.getByRole("button", { name: "Bulk RFQ" }).click().catch(() => {});
  await page.waitForTimeout(1500);
  const bulkInput = page.locator('input[type="file"][accept=".csv"]');
  const bulkVisible = await bulkInput.count();
  let csvParseOk = false;
  if (bulkVisible) {
    await bulkInput.setInputFiles(assetPath("csv"));
    await page.waitForTimeout(1500);
    const txt = await page.locator("body").innerText();
    csvParseOk = /1 items loaded|items loaded/i.test(txt);
  }
  results.surfaces.push({
    id: "buyer-rfq-bulk-csv",
    route: "/dashboard/buyer/rfqs (bulk drawer)",
    role: "buyer",
    csvClientParseLikelyOk: csvParseOk,
    note: "accept=.csv — no server upload until Submit; uses createBulkRfq JSON API. PNG would not parse as CSV.",
  });

  /** -------- Service job request photo (buyer on public engineer page) -------- */
  await uiLogin(page, accounts.buyer.email, accounts.buyer.password);
  await page.goto(`${BASE_URL}/service-engineers`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(4000);
  const engLink = page.locator('a[href*="service-engineers/profile?id="]').first();
  const href = await engLink.getAttribute("href").catch(() => null);
  let serviceJobMatrix = [];
  if (href) {
    const u = href.startsWith("http") ? href : `${BASE_URL}${href}`;
    const urlObj = new URL(u, BASE_URL);
    const id = urlObj.searchParams.get("id");
    await page.goto(`${BASE_URL}/service-engineers/profile?id=${id}&view=request`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    await page.waitForTimeout(4000);
    for (const fmt of ["png", "pdf"]) {
      const p = assetPath(fmt);
      if (!p) continue;
      const cap = [];
      const h = (res) => {
        if (res.url().includes("4000")) cap.push({ u: res.url(), s: res.status() });
      };
      page.on("response", h);
      await page.locator('input[type="file"]').first().setInputFiles(p);
      await page.waitForTimeout(2000);
      page.off("response", h);
      serviceJobMatrix.push({ format: fmt, responses: cap });
    }
  }
  results.surfaces.push({
    id: "buyer-service-job-request-photo",
    route: "/service-engineers/profile?view=request",
    role: "buyer",
    engineerHref: href,
    samples: serviceJobMatrix,
    note: "Optional photo accept=.jpg,.jpeg,.png — selecting file does not POST until form submit.",
  });

  /** -------- OEM product edit — first edit link -------- */
  await uiLogin(page, accounts.oem.email, accounts.oem.password);
  await page.goto(`${BASE_URL}/dashboard/oem/requests`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(6000);
  const editLink = await page.locator('a[href*="/edit"]').first().getAttribute("href").catch(() => null);
  let oemEditInputs = [];
  if (editLink) {
    const full = editLink.startsWith("http") ? editLink : `${BASE_URL}${editLink}`;
    await page.goto(full, { waitUntil: "domcontentloaded", timeout: 120000 });
    await page.waitForTimeout(8000);
    oemEditInputs = await page.locator('input[type="file"]').evaluateAll((els) =>
      els.map((e, i) => ({ i, accept: e.getAttribute("accept"), id: e.id })),
    );
  }
  results.surfaces.push({
    id: "oem-edit-product-files",
    route: editLink || "/dashboard/oem/requests/*/edit",
    role: "oem",
    fileInputs: oemEditInputs,
    note: "Multipart PATCH product; brochure copy in UI may note deferred contract.",
  });

    await browser.close();
    browser = null;

    fs.mkdirSync(path.dirname(REPORT_JSON), { recursive: true });
    fs.writeFileSync(REPORT_JSON, JSON.stringify(results, null, 2), "utf8");

    const md = renderMarkdown(results);
    fs.writeFileSync(REPORT_MD_STUB, md, "utf8");

    console.log(`Wrote ${REPORT_JSON}`);
    console.log(`Wrote ${REPORT_MD_STUB}`);
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }

    if (managedFrontend) {
      await stopProcessTree(managedFrontend);
    }
  }
}

function renderMarkdown(results) {
  const lines = [];
  lines.push(`# Upload surface audit`);
  lines.push(``);
  lines.push(`Generated: ${results.generatedAt}`);
  lines.push(`Frontend: ${results.baseUrl}`);
  lines.push(`API: ${results.apiUrl}`);
  lines.push(``);
  lines.push(`## Direct API format matrix (bypasses UI)`);
  lines.push(`| Endpoint | Format | HTTP | OK | Note |`);
  lines.push(`|----------|--------|------|-----|------|`);
  for (const r of results.directApi) {
    lines.push(
      `| ${r.endpoint} | ${r.format} | ${r.status} | ${r.ok} | ${r.note ?? ""} |`,
    );
  }
  lines.push(``);
  lines.push(`## Surfaces (browser)`);
  for (const s of results.surfaces) {
    lines.push(`### ${s.id}`);
    lines.push(`- **Route:** ${s.route}`);
    lines.push(`- **Role:** ${s.role}`);
    if (s.persistence) lines.push(`- **Persistence / visibility:** ${s.persistence}`);
    if (s.uiMatrix) {
      lines.push(`| Format | Worked | API | Why not |`);
      lines.push(`|--------|--------|-----|---------|`);
      for (const row of s.uiMatrix) {
        lines.push(
          `| ${row.format} | ${row.worked} | ${row.apiStatus ?? "—"} | ${row.reason ?? "—"} |`,
        );
      }
    }
    if (s.fileInputsOnPage !== undefined) lines.push(`- **file inputs on page:** ${s.fileInputsOnPage}`);
    if (s.pageLoaded !== undefined) lines.push(`- **page loaded:** ${s.pageLoaded}`);
    if (s.pngProductCreateWorked !== undefined)
      lines.push(`- **PNG product create:** ${s.pngProductCreateWorked}`);
    if (s.submitWorked !== undefined) lines.push(`- **Submit:** ${s.submitWorked}`);
    if (s.inputAccepts) lines.push(`- **accept:** ${JSON.stringify(s.inputAccepts)}`);
    if (s.fileInputs) lines.push(`- **file inputs:** ${JSON.stringify(s.fileInputs)}`);
    if (s.csvClientParseLikelyOk !== undefined)
      lines.push(`- **CSV parse:** ${s.csvClientParseLikelyOk}`);
    if (s.engineerHref) lines.push(`- **engineer link:** ${s.engineerHref}`);
    if (s.samples) lines.push(`- **samples:** ${JSON.stringify(s.samples)}`);
    if (s.zone) lines.push(`- **zone:** ${s.zone}`);
    if (s.format) lines.push(`- **format:** ${s.format}`);
    if (s.worked !== undefined) lines.push(`- **worked:** ${s.worked}`);
    if (s.apiStatus) lines.push(`- **api status:** ${s.apiStatus}`);
    if (s.note) lines.push(`- **Note:** ${s.note}`);
    lines.push(``);
  }
  lines.push(`## Place order / buy now`);
  lines.push(
    `No file upload on the product **Order now** JSON flow (\`POST /orders/buy-now\`); uploads are on RFQ, profile, store, catalogue, KYC, and service flows.`,
  );
  lines.push(``);
  lines.push(`## Questions back to you`);
  lines.push(
    `1. Should **KYC tier submission dialogs** be covered with seeded tiers that require documents (upgrade path), or is API-only **POST /kyc/upload** enough for compliance?`,
  );
  lines.push(
    `2. For **onboarding** document step, do you want a dedicated incomplete-registration test account, or is production onboarding out of scope?`,
  );
  lines.push(
    `3. Should we add **automated DB assertions** (Mongo read) in CI, or is HTTP 2xx + profile refetch sufficient?`,
  );
  return lines.join("\n");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
