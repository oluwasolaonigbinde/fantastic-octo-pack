import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const ACCOUNTS_FILE =
  process.env.LOCAL_ROLE_AUTH_ACCOUNTS_FILE ||
  path.resolve(
    projectRoot,
    "..",
    "..",
    "scripts",
    "local-role-auth.playwright.accounts.json",
  );
const AUTH_DIR = path.resolve(projectRoot, "playwright", ".auth");
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3100";
const API_URL =
  process.env.PLAYWRIGHT_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:4000/api/v1";
const STORAGE_KEY = "baiy.localRoleAuth.user";
const ROLE_ORDER = ["buyer", "distributor", "oem", "admin", "engineer"];
const REQUESTED_ROLES = (process.env.LOCAL_ROLE_AUTH_ROLES || "")
  .split(",")
  .map((role) => role.trim())
  .filter(Boolean);

function readAccounts() {
  return JSON.parse(fs.readFileSync(ACCOUNTS_FILE, "utf8"));
}

function buildStorageState(user) {
  return {
    cookies: [],
    origins: [
      {
        origin: new URL(BASE_URL).origin,
        localStorage: [
          {
            name: STORAGE_KEY,
            value: JSON.stringify(user),
          },
        ],
      },
    ],
  };
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

async function login(account) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: account.email,
      password: account.password,
    }),
  });

  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.success || !payload?.data) {
    const detail =
      payload?.message ||
      `HTTP ${response.status} while logging in ${account.role}`;
    throw new Error(`Login for ${account.role} failed: ${detail}`);
  }

  if (!payload.data.tokens?.accessToken) {
    throw new Error(
      `Login for ${account.role} returned no tokens. Ensure the backend is running locally with NODE_ENV=development.`,
    );
  }

  if (payload.data.role !== account.role) {
    throw new Error(
      `Expected role ${account.role} but received ${payload.data.role} for ${account.email}.`,
    );
  }

  if (normalizeEmail(payload.data.email) !== normalizeEmail(account.email)) {
    throw new Error(
      `Expected email ${account.email} but received ${payload.data.email || "none"} for ${account.role}.`,
    );
  }

  if (!payload.data._id) {
    throw new Error(`Login for ${account.role} returned no account id.`);
  }

  return payload.data;
}

async function main() {
  const accounts = readAccounts();
  const roles =
    REQUESTED_ROLES.length > 0 ? REQUESTED_ROLES : ROLE_ORDER;
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  for (const role of roles) {
    const account = accounts[role];

    if (!account) {
      throw new Error(`Missing ${role} account in ${ACCOUNTS_FILE}.`);
    }

    const user = await login(account);
    const storageStatePath = path.join(AUTH_DIR, `${role}.json`);
    const storageState = buildStorageState(user);

    fs.writeFileSync(
      storageStatePath,
      JSON.stringify(storageState, null, 2),
      "utf8",
    );

    console.log(`wrote ${role} storage state -> ${storageStatePath}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
