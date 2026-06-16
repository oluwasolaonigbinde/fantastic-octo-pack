import { expect, test } from "@playwright/test";

/** Smoke: new admin section routes return a non-5xx response (may redirect to login). */
const ADMIN_PATHS = [
  "/dashboard/admin",
  "/dashboard/admin/platform-users",
  "/dashboard/admin/products",
  "/dashboard/admin/rfqs-orders",
  "/dashboard/admin/settings-security",
  "/dashboard/admin/user-management",
  "/dashboard/admin/user-management/roles",
  "/dashboard/admin/services",
  "/dashboard/admin/payment",
  "/dashboard/admin/disputes",
  "/dashboard/admin/subscriptions",
  "/dashboard/admin/kyc-verification",
  "/dashboard/admin/messaging",
  "/dashboard/admin/profile",
] as const;

test.describe("admin shell routes", () => {
  for (const path of ADMIN_PATHS) {
    test(`GET ${path} is not server error`, async ({ request }) => {
      const res = await request.get(path, { maxRedirects: 0 });
      expect(res.status()).toBeLessThan(500);
    });
  }
});
