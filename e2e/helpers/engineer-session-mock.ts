/**
 * Shared mock session + API stubs for engineer Playwright runs (aligned with slice-05 helpers).
 */
import type { Page } from "@playwright/test";

const API_BASE_URL =
  process.env.PLAYWRIGHT_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000/api/v1";

export const AUTH_SESSION_STORAGE_KEY = "baiy.auth.session";

export type MockRole = "buyer" | "distributor" | "oem" | "engineer";

const buildPaginated = <T,>(docs: T[], totalDocs = docs.length) => ({
  docs,
  page: 1,
  limit: 10,
  hasNextPage: false,
  hasPreviousPage: false,
  nextPage: null,
  previousPage: null,
  totalDocs,
  totalPages: 1,
});

const ok = (message: string, data: unknown) => ({
  success: true,
  message,
  data,
});

const buildSessionUser = (role: MockRole) => ({
  _id: `slice-05-${role}-user`,
  firstName:
    role === "oem"
      ? "Olivia"
      : role === "distributor"
        ? "Daniel"
        : role === "engineer"
          ? "Emeka"
          : "Amina",
  lastName:
    role === "oem"
      ? "Mensah"
      : role === "distributor"
        ? "Cole"
        : role === "engineer"
          ? "Adebayo"
          : "Bello",
  email: `${role}.slice05@example.com`,
  phoneNumber: "+2348012345678",
  role,
  status: "active",
  isEmailVerified: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  tokens: {
    accessToken: `slice-05-${role}-access-token`,
    refreshToken: `slice-05-${role}-refresh-token`,
  },
});

export async function seedSession(page: Page, role: MockRole) {
  const user = buildSessionUser(role);
  await page.addInitScript(
    ([key, val]) => window.localStorage.setItem(key, val),
    [AUTH_SESSION_STORAGE_KEY, JSON.stringify(user)],
  );
  return user;
}

const MOCK_SERVICE_REQUEST_PENDING = {
  _id: "507f1f77bcf86cd799439011",
  jobType: "Installation",
  equipmentName: "Philips Ultrasound Machine",
  brand: "Philips",
  preferredDate: "2026-02-03T00:00:00.000Z",
  preferredTime: "Morning (8:00 AM - 12:00 PM)",
  serviceDescription:
    "New CT scanner needs installation and calibration. Room is prepared with proper electrical setup and cooling system.",
  requester: {
    _id: "slice-05-buyer-user",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "buyer.slice05@example.com",
  },
  engineer: {
    _id: "slice-05-engineer-user",
    firstName: "Emeka",
    lastName: "Adebayo",
    email: "engineer.slice05@example.com",
  },
  status: "pending",
  createdAt: "2026-02-01T00:00:00.000Z",
  updatedAt: "2026-02-01T00:00:00.000Z",
};

const MOCK_PRODUCT_ID = "slice-05-product-1";
const MOCK_PRODUCT_SUBMITTED = {
  _id: MOCK_PRODUCT_ID,
  name: "Industrial Pump A3",
  category: "Equipment",
  sub_category: "Pumps & Compressors",
  quantityAvailable: 50,
  priceMode: "fixed",
  pricePerUnit: 360028,
  countries: ["NG"],
  isRfqAvailable: false,
  keySpecifications: "Flow Rate: 500 L/min; Max Pressure: 10 bar",
  description: "Heavy-duty industrial pump for demanding environments.",
  images: [{ url: "/images/product-placeholder.webp", cloudinary_id: "cloud-1", isDefault: true }],
  status: "pending",
  oemApprovalStatus: "pending",
  createdBy: {
    _id: "slice-05-distributor-user",
    firstName: "Daniel",
    lastName: "Cole",
    email: "distributor.slice05@example.com",
    role: "distributor",
    isEmailVerified: true,
  },
  createdAt: "2026-03-15T00:00:00.000Z",
  updatedAt: "2026-03-15T00:00:00.000Z",
};

export async function installBaseApi(page: Page, options: { role: MockRole }) {
  const user = buildSessionUser(options.role);
  let currentProduct: Record<string, unknown> = { ...MOCK_PRODUCT_SUBMITTED };

  await page.route(`${API_BASE_URL}/**`, async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url === `${API_BASE_URL}/auth/profile` && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Profile fetched successfully", { ...user, tokens: undefined })),
      });
      return;
    }

    if (url.includes("/categories")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("Categories fetched successfully", buildPaginated([
            { _id: "cat-eq", name: "Equipment", description: "Industrial equipment" },
            { _id: "cat-con", name: "Consumables", description: "Industrial consumables" },
          ])),
        ),
      });
      return;
    }

    if (
      url.includes("/products") &&
      !url.includes(`/products/${MOCK_PRODUCT_ID}`) &&
      !url.includes("/review") &&
      method === "GET"
    ) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Products fetched successfully", buildPaginated([currentProduct]))),
      });
      return;
    }

    if (url.includes(`/products/${MOCK_PRODUCT_ID}`) && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Product fetched successfully", currentProduct)),
      });
      return;
    }

    if (url.includes(`/products/${MOCK_PRODUCT_ID}`) && method === "PATCH") {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      currentProduct = {
        ...currentProduct,
        ...body,
        updatedAt: "2026-03-16T00:00:00.000Z",
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Product updated successfully", currentProduct)),
      });
      return;
    }

    if (url.includes(`/products/${MOCK_PRODUCT_ID}/review`) && method === "PATCH") {
      const body = route.request().postDataJSON() as { action: string; rejectionReason?: string };
      const updatedStatus = body.action === "approve" ? "verified" : "rejected";
      currentProduct = {
        ...currentProduct,
        status: updatedStatus,
        oemApprovalStatus: body.action === "approve" ? "approved" : "rejected",
        oemRejectionReason: body.rejectionReason,
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Product reviewed successfully", currentProduct)),
      });
      return;
    }

    if (url.includes("/products") && method === "POST") {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(ok("Product created successfully", MOCK_PRODUCT_SUBMITTED)),
      });
      return;
    }

    if (url.includes("/quotes") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Quotes fetched", buildPaginated([]))),
      });
      return;
    }

    if (url.includes("/service-requests") && method === "GET") {
      const pathname = new URL(url).pathname;
      const isListPath =
        pathname.endsWith("/service-requests") || pathname.endsWith("/service-requests/");
      const singleMatch = pathname.match(/\/service-requests\/([^/]+)\/?$/);
      if (isListPath) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(
            ok("Service requests fetched successfully", [MOCK_SERVICE_REQUEST_PENDING]),
          ),
        });
        return;
      }
      if (singleMatch?.[1] && singleMatch[1] !== "status") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(
            ok("Service request fetched successfully", {
              ...MOCK_SERVICE_REQUEST_PENDING,
              _id: singleMatch[1],
            }),
          ),
        });
        return;
      }
    }

    if (url.includes("/service-requests/") && url.includes("/status") && method === "PATCH") {
      const body = route.request().postDataJSON() as { status?: string };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("Service request status updated successfully", {
            ...MOCK_SERVICE_REQUEST_PENDING,
            status: body.status ?? MOCK_SERVICE_REQUEST_PENDING.status,
            updatedAt: "2026-02-02T00:00:00.000Z",
          }),
        ),
      });
      return;
    }

    await route.continue();
  });
}
