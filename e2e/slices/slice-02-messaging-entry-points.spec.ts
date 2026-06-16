import { expect, test, type Page } from "@playwright/test";

const API_BASE_URL =
  process.env.PLAYWRIGHT_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000/api/v1";

const AUTH_SESSION_STORAGE_KEY = "baiy.auth.session";
const PENDING_AUTH_INTENT_STORAGE_KEY = "baiy.auth.pending-intent";

const DISTRIBUTOR_ID = "507f1f77bcf86cd799439041";
const ASSIGNED_OEM_ID = "507f1f77bcf86cd799439099";
const PRODUCT_ID = "507f1f77bcf86cd799439055";

const buyerUser = {
  _id: "507f1f77bcf86cd799439011",
  firstName: "Bola",
  lastName: "Akin",
  email: "buyer.messaging@example.com",
  phoneNumber: "+2348012345678",
  role: "buyer",
  status: "active",
  isEmailVerified: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  tokens: {
    accessToken: "buyer-messaging-access-token",
    refreshToken: "buyer-messaging-refresh-token",
  },
};

const ok = (message: string, data: unknown) => ({
  success: true,
  message,
  data,
});

const buildPaginated = <T,>(docs: T[]) => ({
  docs,
  page: 1,
  limit: 10,
  hasNextPage: false,
  hasPreviousPage: false,
  nextPage: null,
  previousPage: null,
  totalDocs: docs.length,
  totalPages: 1,
});

const product = {
  _id: PRODUCT_ID,
  name: "MRI Messaging Receiver Check",
  category: "Equipment",
  sub_category: "Imaging",
  quantityAvailable: 12,
  priceMode: "fixed",
  pricePerUnit: 175000,
  countries: ["NG"],
  isRfqAvailable: true,
  keySpecifications: "Magnet Strength: 1.5 Tesla",
  description: "Diagnostic imaging equipment for hospitals.",
  images: [{ url: "/images/product.webp", cloudinary_id: "product-image", isDefault: true }],
  status: "approved",
  oemApprovalStatus: "approved",
  assignedOem: {
    _id: ASSIGNED_OEM_ID,
    firstName: "Ola",
    lastName: "Manufacturer",
    email: "oem.messaging@example.com",
    role: "oem",
    isEmailVerified: true,
  },
  createdBy: {
    _id: DISTRIBUTOR_ID,
    firstName: "Dara",
    lastName: "Distributor",
    email: "distributor.messaging@example.com",
    role: "distributor",
    isEmailVerified: true,
  },
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const distributorProfile = {
  _id: DISTRIBUTOR_ID,
  firstName: "Dara",
  lastName: "Distributor",
  phoneNumber: "+2348012345678",
  address: "Ikeja, Lagos",
  role: "distributor",
  rating: 4.8,
  reviewCount: 6,
  distributorStoreProfile: {
    businessName: "Dara Medical Supply",
    about: "Medical equipment distributor.",
    city: "Ikeja",
    state: "Lagos",
    country: "Nigeria",
  },
};

async function seedBuyerSession(page: Page) {
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [AUTH_SESSION_STORAGE_KEY, JSON.stringify(buyerUser)],
  );
}

async function installApiMocks(page: Page) {
  const conversation = {
    id: "slice-02-messaging-conversation",
    participants: [buyerUser._id, DISTRIBUTOR_ID],
    createdAt: "2026-04-20T08:00:00.000Z",
    lastMessageAt: null,
    lastMessagePreview: null,
    counterpart: {
      id: DISTRIBUTOR_ID,
      role: "distributor",
      displayName: "Dara Distributor",
      avatarUrl: null,
      secondaryLabel: "Verified Seller",
      isVerifiedSeller: true,
    },
  };

  await page.route(`${API_BASE_URL}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();

    if (url.pathname.endsWith("/auth/profile") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Profile fetched successfully", buyerUser)),
      });
      return;
    }

    if (url.pathname.endsWith("/auth/login") && method === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Login successful", buyerUser)),
      });
      return;
    }

    if (url.pathname.endsWith(`/products/${PRODUCT_ID}`) && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Product fetched successfully", product)),
      });
      return;
    }

    if (url.pathname.endsWith("/products") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Products fetched successfully", buildPaginated([product]))),
      });
      return;
    }

    if (url.pathname.endsWith(`/public/profiles/${DISTRIBUTOR_ID}`) && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Public profile fetched successfully", distributorProfile)),
      });
      return;
    }

    if (url.pathname.endsWith("/conversations") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Conversations retrieved", [])),
      });
      return;
    }

    if (url.pathname.endsWith("/conversations/start") && method === "POST") {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(ok("Conversation created", conversation)),
      });
      return;
    }

    if (
      url.pathname.endsWith(`/conversations/${conversation.id}`) &&
      method === "GET"
    ) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("Conversation fetched", { conversation, messages: [] }),
        ),
      });
      return;
    }

    await route.continue();
  });
}

test.describe("Slice 2 messaging entry points", () => {
  test.beforeEach(async ({ page }) => {
    await installApiMocks(page);
  });

  test("logged-out product message stores exact intent and resumes after login", async ({
    page,
  }) => {
    await page.goto(`/products/${PRODUCT_ID}`);
    await page.getByRole("button", { name: /chat with seller/i }).click();

    await expect(page).toHaveURL(/\/login$/);

    const pendingIntent = await page.evaluate((key) => {
      const raw = window.sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }, PENDING_AUTH_INTENT_STORAGE_KEY);

    expect(pendingIntent).toEqual({
      action: "send_message",
      receiverId: DISTRIBUTOR_ID,
    });

    await page.getByLabel(/email address/i).fill("buyer.messaging@example.com");
    await page.getByLabel(/^password$/i).fill("SlicePass123!");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    await expect(page).toHaveURL(
      `/dashboard/buyer/messages?compose=1&to=${DISTRIBUTOR_ID}`,
    );
  });

  test("logged-in product message routes to listing owner, not assigned OEM", async ({
    page,
  }) => {
    await seedBuyerSession(page);
    await page.goto(`/products/${PRODUCT_ID}`);
    await page.getByRole("button", { name: /chat with seller/i }).click();

    await expect(page).toHaveURL(
      `/dashboard/buyer/messages?compose=1&to=${DISTRIBUTOR_ID}`,
    );
    expect(page.url()).not.toContain(ASSIGNED_OEM_ID);
  });

  test("logged-in product Contact Seller uses the same canonical entry", async ({
    page,
  }) => {
    await seedBuyerSession(page);
    await page.goto(`/products/${PRODUCT_ID}`);
    await page.getByRole("button", { name: /contact seller/i }).click();

    await expect(page).toHaveURL(
      `/dashboard/buyer/messages?compose=1&to=${DISTRIBUTOR_ID}`,
    );
  });

  test("logged-in distributor profile message targets profile owner", async ({
    page,
  }) => {
    await seedBuyerSession(page);
    await page.goto(`/distributor/profile?id=${DISTRIBUTOR_ID}`);
    await page.getByRole("button", { name: /send message/i }).click();

    await expect(page).toHaveURL(
      `/dashboard/buyer/messages?compose=1&to=${DISTRIBUTOR_ID}`,
    );
  });

  test("logged-out distributor profile message stores exact intent and resumes after login", async ({
    page,
  }) => {
    await page.goto(`/distributor/profile?id=${DISTRIBUTOR_ID}`);
    await page.getByRole("button", { name: /send message/i }).click();

    await expect(page).toHaveURL(/\/login$/);

    const pendingIntent = await page.evaluate((key) => {
      const raw = window.sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }, PENDING_AUTH_INTENT_STORAGE_KEY);

    expect(pendingIntent).toEqual({
      action: "send_message",
      receiverId: DISTRIBUTOR_ID,
    });

    await page.getByLabel(/email address/i).fill("buyer.messaging@example.com");
    await page.getByLabel(/^password$/i).fill("SlicePass123!");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    await expect(page).toHaveURL(
      `/dashboard/buyer/messages?compose=1&to=${DISTRIBUTOR_ID}`,
    );
  });
});
