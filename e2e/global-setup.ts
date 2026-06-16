import type { FullConfig } from "@playwright/test";

const WARMUP_TIMEOUT_MS = 30_000;
const DEFAULT_WARM_PATHS = [
  "/",
  "/login",
  "/dashboard",
  "/dashboard/buyer",
  "/dashboard/distributor",
  "/dashboard/oem",
  "/dashboard/oem/requests",
];

function parseWarmPaths(): string[] {
  if (process.env.PLAYWRIGHT_SKIP_FRONTEND_WARMUP === "1") {
    return [];
  }

  const raw = process.env.PLAYWRIGHT_FRONTEND_WARM_PATHS;

  if (!raw) {
    return DEFAULT_WARM_PATHS;
  }

  return raw
    .split(",")
    .map((pathValue) => pathValue.trim())
    .filter(Boolean)
    .map((pathValue) => (pathValue.startsWith("/") ? pathValue : `/${pathValue}`));
}

async function fetchPage(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WARMUP_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    await response.arrayBuffer();
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

export default async function globalSetup(config: FullConfig) {
  const baseURL =
    process.env.PLAYWRIGHT_BASE_URL ||
    String(config.projects[0]?.use.baseURL || "");

  if (!baseURL) {
    return;
  }

  const warmPaths = parseWarmPaths();

  if (warmPaths.length === 0) {
    console.log("[playwright] Frontend warm-up skipped.");
    return;
  }

  console.log(
    `[playwright] Warming frontend routes at ${baseURL} (${warmPaths.join(", ")}).`,
  );

  for (const warmPath of warmPaths) {
    const routeUrl = new URL(warmPath, baseURL).toString();
    const startedAt = Date.now();

    try {
      const response = await fetchPage(routeUrl);
      const elapsedMs = Date.now() - startedAt;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      console.log(`[playwright] Warmed ${warmPath} in ${elapsedMs}ms.`);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Frontend warm-up failed for ${routeUrl} within ${WARMUP_TIMEOUT_MS}ms. ${detail}`,
      );
    }
  }
}
