import fs from "node:fs";
import path from "node:path";

import { expect, test as base } from "@playwright/test";

export type LocalRole = "buyer" | "distributor" | "oem" | "admin" | "engineer";

export const roleStorageStatePaths: Record<LocalRole, string> = {
  buyer: path.join(process.cwd(), "playwright", ".auth", "buyer.json"),
  distributor: path.join(process.cwd(), "playwright", ".auth", "distributor.json"),
  oem: path.join(process.cwd(), "playwright", ".auth", "oem.json"),
  admin: path.join(process.cwd(), "playwright", ".auth", "admin.json"),
  engineer: path.join(process.cwd(), "playwright", ".auth", "engineer.json"),
};

export const roleDashboardPaths: Record<LocalRole, string> = {
  buyer: "/dashboard/buyer",
  distributor: "/dashboard/distributor",
  oem: "/dashboard/oem",
  admin: "/dashboard/admin",
  engineer: "/dashboard/engineer",
};

const storageStateForRole = (role: LocalRole) => {
  const storageStatePath = roleStorageStatePaths[role];

  if (!fs.existsSync(storageStatePath)) {
    throw new Error(
      `Missing ${role} auth state at ${storageStatePath}. Run "npm run test:e2e:auth:refresh" first.`,
    );
  }

  return storageStatePath;
};

export const buyerTest = base.extend({});
buyerTest.use({ storageState: storageStateForRole("buyer") });

export const distributorTest = base.extend({});
distributorTest.use({ storageState: storageStateForRole("distributor") });

export const oemTest = base.extend({});
oemTest.use({ storageState: storageStateForRole("oem") });

export const adminTest = base.extend({});
adminTest.use({ storageState: storageStateForRole("admin") });

export const engineerTest = base.extend({});
engineerTest.use({ storageState: storageStateForRole("engineer") });

export { expect };
