import { expect, test } from "@playwright/test";

const OEM_USER = {
  _id: "oem-direct-sales-local-user",
  firstName: "Halo",
  lastName: "Care",
  phoneNumber: "+2348010002222",
  address: "Lekki, Lagos",
  email: "oem.dashboard@local.test",
  role: "oem",
  status: "active",
  isEmailVerified: true,
  updatedAt: "2026-04-16T10:30:00.000Z",
  createdAt: "2026-04-01T09:00:00.000Z",
  tokens: {
    accessToken: "oem-direct-sales-access-token",
    refreshToken: "oem-direct-sales-refresh-token",
  },
};

const DISTRIBUTOR_A = {
  _id: "oem-direct-sales-dist-a",
  firstName: "HealthPlus",
  lastName: "Solution",
  email: "healthplus@local.test",
  phoneNumber: "+2348010003000",
};

const DISTRIBUTOR_B = {
  _id: "oem-direct-sales-dist-b",
  firstName: "Med",
  lastName: "Distribute",
  email: "meddistribute@local.test",
  phoneNumber: "+2348010004000",
};

const mockProducts = [
  {
    _id: "oem-product-1",
    name: "Patient Monitor MX400",
    category: "Equipment",
    pricePerUnit: 120000,
    images: [],
    oemApprovalStatus: "approved",
    createdBy: DISTRIBUTOR_A,
    status: "approved",
    countries: ["lagos"],
    submittedAt: "2026-05-07T10:00:00.000Z",
    createdAt: "2026-05-07T10:00:00.000Z",
    updatedAt: "2026-05-17T10:00:00.000Z",
  },
  {
    _id: "oem-product-2",
    name: "Ultrasound Probe",
    category: "Equipment",
    pricePerUnit: 90000,
    images: [],
    oemApprovalStatus: "pending",
    createdBy: DISTRIBUTOR_A,
    status: "pending",
    countries: ["abuja"],
    submittedAt: "2026-05-10T10:00:00.000Z",
    createdAt: "2026-05-10T10:00:00.000Z",
    updatedAt: "2026-05-18T10:00:00.000Z",
  },
  {
    _id: "oem-product-3",
    name: "ECG Cable Set",
    category: "Consumables",
    pricePerUnit: 15000,
    images: [],
    oemApprovalStatus: "approved",
    createdBy: DISTRIBUTOR_B,
    status: "approved",
    countries: ["kano"],
    submittedAt: "2026-05-12T10:00:00.000Z",
    createdAt: "2026-05-12T10:00:00.000Z",
    updatedAt: "2026-05-20T10:00:00.000Z",
  },
];

const productListPayload = {
  success: true,
  message: "OEM listing requests fetched",
  data: {
    docs: mockProducts,
    page: 1,
    limit: 12,
    hasNextPage: false,
    hasPreviousPage: false,
    nextPage: null,
    previousPage: null,
    totalDocs: mockProducts.length,
    totalPages: 1,
  },
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(({ user }) => {
    window.localStorage.setItem("baiy.auth.session", JSON.stringify(user));
    window.localStorage.setItem("baiy.localRoleAuth.user", JSON.stringify(user));
    window.localStorage.setItem("baiy.localRoleAuth.enabled", "1");
  }, { user: OEM_USER });

  await page.route("**/api/v1/products**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(productListPayload),
    });
  });

  await page.route("**/api/v1/auth/profile**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        message: "Profile hydrated",
        data: OEM_USER,
      }),
    });
  });
});

test("renders OEM dashboard desktop, mobile, and direct sales modal", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1500 });
  await page.goto("/dashboard/oem");

  await expect(page.getByTestId("oem-dashboard-page")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Direct Sales" })).toBeVisible();
  await expect(page.getByText("Analytics and marketing intelligence")).toBeVisible();
  await expect(page.getByText("Authorized Distributors")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Product Mapping Request" }),
  ).toBeVisible();

  await page.screenshot({
    path: testInfo.outputPath("oem-dashboard-desktop.png"),
    fullPage: true,
  });

  await page.getByTestId("oem-direct-sales-trigger").click();
  await expect(page.getByTestId("oem-direct-sales-modal")).toBeVisible();
  await expect(page.getByText("About Direct Sales")).toBeVisible();
  await expect(page.getByText("Requirements")).toBeVisible();
  await expect(page.getByText("What you get")).toBeVisible();

  await page.screenshot({
    path: testInfo.outputPath("oem-direct-sales-modal.png"),
    fullPage: true,
  });

  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByTestId("oem-direct-sales-modal")).toBeHidden();

  await page.setViewportSize({ width: 390, height: 1280 });
  await page.reload();

  await expect(page.getByTestId("oem-dashboard-page")).toBeVisible();
  await expect(
    page.locator('button[aria-label="Open notifications"]').filter({ visible: true }),
  ).toBeVisible();
  await expect(
    page.locator('button[aria-label="Open navigation menu"]').filter({ visible: true }),
  ).toBeVisible();
  await expect(page.getByTestId("oem-stats-grid")).toBeVisible();

  await page.screenshot({
    path: testInfo.outputPath("oem-dashboard-mobile.png"),
    fullPage: true,
  });
});
