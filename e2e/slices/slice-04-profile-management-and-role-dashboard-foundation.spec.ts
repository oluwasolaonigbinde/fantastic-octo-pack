import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

const API_BASE_URL =
  process.env.PLAYWRIGHT_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000/api/v1";

const AUTH_SESSION_STORAGE_KEY = "baiy.auth.session";
const BANNED_INTERNAL_COPY = /\b(?:Slice|Deferred|Foundation|Playwright)\b/i;

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const formatDateLikeUi = (value: string) => {
  const date = new Date(value);
  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const day = date.getDate();
  const suffix =
    day >= 10 && day <= 13
      ? "th"
      : ({
          1: "st",
          2: "nd",
          3: "rd",
        }[day % 10] ?? "th");

  return `${daysOfWeek[date.getDay()]} ${day}${suffix} ${months[date.getMonth()]}, ${date.getFullYear()}`;
};

type SupportedRole = "buyer" | "distributor" | "oem" | "engineer";

type RoleScenario = {
  role: SupportedRole;
  dashboardPath: string;
  dashboardHeading: string;
  dashboardDescription: string;
  dashboardModules: string[];
  navLabels: string[];
  disabledProfileTabs: string[];
  desktopScreenshot: string;
  mobileNavScreenshot: string;
};

const roleIdentity = {
  buyer: {
    firstName: "Amina",
    lastName: "Bello",
    email: "buyer.dashboard@example.com",
  },
  distributor: {
    firstName: "Daniel",
    lastName: "Cole",
    email: "distributor.dashboard@example.com",
  },
  oem: {
    firstName: "Olivia",
    lastName: "Mensah",
    email: "oem.dashboard@example.com",
  },
  engineer: {
    firstName: "Emeka",
    lastName: "Adebayo",
    email: "engineer.dashboard@example.com",
  },
} satisfies Record<
  SupportedRole,
  {
    firstName: string;
    lastName: string;
    email: string;
  }
>;

const roleScenarios: RoleScenario[] = [
  {
    role: "buyer",
    dashboardPath: "/dashboard/buyer",
    dashboardHeading: "My Dashboard",
    dashboardDescription: "Get insight into everything happening in your account",
    dashboardModules: [
      "Update your KYC level.",
      "All RFQs",
      "Weekly Quotation Analysis",
      "Recent Messages",
      "Recent Request for Quote",
    ],
    navLabels: [
      "RFQs",
      "Service Request",
      "KYC Verification",
      "Wallet & Payment",
      "Messages",
      "Orders",
    ],
    disabledProfileTabs: ["Notification settings", "Payment method"],
    desktopScreenshot: "buyer-dashboard-desktop.png",
    mobileNavScreenshot: "buyer-dashboard-mobile-nav.png",
  },
  {
    role: "distributor",
    dashboardPath: "/dashboard/distributor",
    dashboardHeading: "Dashboard Overview",
    dashboardDescription: "Wednesday 10th September, 2025",
    dashboardModules: [
      "Total quote requests",
      "Quote Request",
      "Product Review Ratio",
      "Top 10 Most Requested Product",
      "Recent Products",
    ],
    navLabels: [
      "My Catalogue",
      "KYC Verification",
      "Subscriptions",
      "Quote Request",
      "Orders",
      "Wallet & Payment",
      "Messaging",
      "System Settings",
    ],
    disabledProfileTabs: [],
    desktopScreenshot: "distributor-dashboard-desktop.png",
    mobileNavScreenshot: "distributor-dashboard-mobile-nav.png",
  },
  {
    role: "oem",
    dashboardPath: "/dashboard/oem",
    dashboardHeading: "Dashboard Overview",
    dashboardDescription: formatDateLikeUi(new Date().toISOString()),
    dashboardModules: [
      "Total distributor",
      "Total listing request",
      "Product Verification Ratio",
      "Recent Listing Request",
    ],
    navLabels: [
      "Distributors",
      "Listing Request",
      "System Settings",
      "KYC Verification",
      "Subscription",
      "Messaging",
    ],
    disabledProfileTabs: [],
    desktopScreenshot: "oem-dashboard-desktop.png",
    mobileNavScreenshot: "oem-dashboard-mobile-nav.png",
  },
  {
    role: "engineer",
    dashboardPath: "/dashboard/engineer",
    dashboardHeading: "My Dashboard",
    dashboardDescription: "Get insight into everything happening in your account",
    dashboardModules: [
      "Update your subscription badge. Click here to upgrade.",
      "Upgrade your KYC. Click here to upgrade.",
      "Recent Job Requests",
      "Philips Ultrasound Machine",
    ],
    navLabels: [
      "Job Requests",
      "Wallet",
      "Messaging",
      "KYC Verification",
      "Subscription",
    ],
    disabledProfileTabs: ["Notification settings"],
    desktopScreenshot: "engineer-dashboard-desktop.png",
    mobileNavScreenshot: "engineer-dashboard-mobile-nav.png",
  },
];

const buildMockAvatarUrl = (role: SupportedRole, variant: "original" | "updated") =>
  `/images/profile.png?role=${role}&variant=${variant}`;

const buildPaginatedData = <T,>(docs: T[], totalDocs = docs.length) => ({
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

const mockCategoryDocs = [
  {
    _id: "category-equipment",
    name: "Equipment",
    description: "Medical equipment",
  },
  {
    _id: "category-consumables",
    name: "Consumables",
    description: "Medical consumables",
  },
];

const mockProductDocs = [
  {
    _id: "product-1",
    name: "Ultrasound Console",
    images: [
      {
        url: "/images/product-placeholder.webp",
        isDefault: true,
      },
    ],
    pricePerUnit: "360028.00",
    quantityAvailable: 12,
    status: "verified",
    category: "Equipment",
  },
  {
    _id: "product-2",
    name: "Infusion Pump",
    images: [
      {
        url: "/images/product-placeholder.webp",
        isDefault: true,
      },
    ],
    pricePerUnit: "120450.00",
    quantityAvailable: 8,
    status: "pending",
    category: "Equipment",
  },
  {
    _id: "product-3",
    name: "Sterile Consumables Kit",
    images: [
      {
        url: "/images/product-placeholder.webp",
        isDefault: true,
      },
    ],
    pricePerUnit: "8200.00",
    quantityAvailable: 50,
    status: "verified",
    category: "Consumables",
  },
];

const mockQuoteDocs = [
  {
    _id: "quote-1",
    status: "pending",
  },
  {
    _id: "quote-2",
    status: "responded",
  },
  {
    _id: "quote-3",
    status: "pending",
  },
  {
    _id: "quote-4",
    status: "responded",
  },
];

const buildSessionUser = (role: SupportedRole) => {
  const identity = roleIdentity[role];

  return {
    _id: `slice-04-${role}-user`,
    firstName: identity.firstName,
    lastName: identity.lastName,
    phoneNumber: "+2348012345678",
    address: "14 Profile Lane, Lagos",
    email: identity.email,
    displayPhoto: {
      url: buildMockAvatarUrl(role, "original"),
      cloudinary_id: `${role}-original-photo`,
    },
    role,
    status: "active",
    isEmailVerified: true,
    dateOfBirth: "1990-05-10T00:00:00.000Z",
    createdAt: "2026-03-15T00:00:00.000Z",
    updatedAt: "2026-03-15T00:00:00.000Z",
    tokens: {
      accessToken: `slice-04-${role}-access-token`,
      refreshToken: `slice-04-${role}-refresh-token`,
    },
  };
};

const buildSuccessResponse = (message: string, data: unknown) => ({
  success: true,
  message,
  data,
});

async function seedSessionStorage(page: Page, sessionUser: ReturnType<typeof buildSessionUser>) {
  await page.addInitScript(
    ([storageKey, serializedUser]) => {
      window.localStorage.setItem(storageKey, serializedUser);
    },
    [AUTH_SESSION_STORAGE_KEY, JSON.stringify(sessionUser)],
  );
}

async function installMockApi(
  page: Page,
  options: {
    role: SupportedRole;
    onProfileRead?: () => void;
    onProfileUpdate?: (payload: Record<string, unknown>) => void;
    onPasswordUpdate?: (payload: Record<string, unknown>) => void;
    onPhotoUpload?: (payload: string) => void;
    currentUser: ReturnType<typeof buildSessionUser>;
    setCurrentUser: (user: ReturnType<typeof buildSessionUser>) => void;
  },
) {
  let currentUser = options.currentUser;

  await page.route(`${API_BASE_URL}/**`, async (route) => {
    const request = route.request();
    const url = request.url();
    const method = request.method();

    if (url === `${API_BASE_URL}/auth/profile` && method === "GET") {
      options.onProfileRead?.();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          buildSuccessResponse("Profile fetched successfully", {
            ...currentUser,
            tokens: undefined,
          }),
        ),
      });
      return;
    }

    if (url === `${API_BASE_URL}/auth/profile` && method === "PATCH") {
      const payload = request.postDataJSON() as Record<string, unknown>;
      options.onProfileUpdate?.(payload);
      currentUser = {
        ...currentUser,
        ...payload,
        dateOfBirth: `${payload.dateOfBirth}T00:00:00.000Z`,
        updatedAt: "2026-03-16T00:00:00.000Z",
      };
      options.setCurrentUser(currentUser);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          buildSuccessResponse("Profile updated successfully", {
            ...currentUser,
            tokens: undefined,
          }),
        ),
      });
      return;
    }

    if (url === `${API_BASE_URL}/auth/display-photo` && method === "POST") {
      const payload =
        request.postDataBuffer()?.toString("utf8") ?? request.postData() ?? "";
      options.onPhotoUpload?.(payload);
      currentUser = {
        ...currentUser,
        displayPhoto: {
          url: buildMockAvatarUrl(options.role, "updated"),
          cloudinary_id: `${options.role}-updated-photo`,
        },
      };
      options.setCurrentUser(currentUser);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          buildSuccessResponse("Display photo uploaded successfully", {
            ...currentUser,
            tokens: undefined,
          }),
        ),
      });
      return;
    }

    if (url === `${API_BASE_URL}/auth/change-password` && method === "POST") {
      const payload = request.postDataJSON() as Record<string, unknown>;
      options.onPasswordUpdate?.(payload);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          buildSuccessResponse("Password updated successfully", {
            ...currentUser,
            tokens: undefined,
          }),
        ),
      });
      return;
    }

    if (url.includes(`${API_BASE_URL}/products`) && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          buildSuccessResponse(
            "Products fetched successfully",
            buildPaginatedData(mockProductDocs),
          ),
        ),
      });
      return;
    }

    if (url.includes(`${API_BASE_URL}/quotes`) && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          buildSuccessResponse(
            "Quotes fetched successfully",
            buildPaginatedData(mockQuoteDocs),
          ),
        ),
      });
      return;
    }

    if (url.includes(`${API_BASE_URL}/categories`) && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          buildSuccessResponse(
            "Categories fetched successfully",
            buildPaginatedData(mockCategoryDocs),
          ),
        ),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(buildSuccessResponse("Mocked response", {})),
    });
  });
}

async function openDashboardWithMocks(page: Page, scenario: RoleScenario) {
  const sessionUser = buildSessionUser(scenario.role);
  let currentUser = { ...sessionUser };

  await seedSessionStorage(page, sessionUser);
  await installMockApi(page, {
    role: scenario.role,
    currentUser,
    setCurrentUser: (user) => {
      currentUser = user;
    },
  });

  await page.goto("/dashboard");
  await expect(page).toHaveURL(new RegExp(`${escapeRegex(scenario.dashboardPath)}$`));
  await expect(
    page.getByRole("heading", {
      name: new RegExp(`^${escapeRegex(scenario.dashboardHeading)}$`, "i"),
    }),
  ).toBeVisible();
  await expect(page.getByText(scenario.dashboardDescription, { exact: true })).toBeVisible();

  return {
    getCurrentUser: () => currentUser,
  };
}

async function assertDashboardSemantics(page: Page, scenario: RoleScenario) {
  const desktopSidebar = page.locator("aside").first();

  await expect(
    desktopSidebar.getByRole("link", { name: /^Dashboard$/ }),
  ).toBeVisible();

  for (const moduleName of scenario.dashboardModules) {
    await expect(page.getByText(new RegExp(escapeRegex(moduleName), "i")).first()).toBeVisible();
  }

  for (const navLabel of scenario.navLabels) {
    await expect(
      desktopSidebar.getByText(new RegExp(`^${escapeRegex(navLabel)}$`, "i")).first(),
    ).toBeVisible();
  }

  await expect(page.locator("body")).not.toContainText(BANNED_INTERNAL_COPY);
}

async function assertProfileWorkspace(page: Page, scenario: RoleScenario) {
  await page.getByLabel("Go to Profile").click();

  await expect(page).toHaveURL(new RegExp(`${escapeRegex(scenario.dashboardPath)}/profile$`));
  await expect(page.getByRole("heading", { name: /^My Profile$/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Personal information/i })).toBeEnabled();
  await expect(page.getByRole("button", { name: /Password update/i })).toBeEnabled();

  for (const tabLabel of scenario.disabledProfileTabs) {
    await expect(
      page.getByRole("button", {
        name: new RegExp(escapeRegex(tabLabel), "i"),
      }),
    ).toBeDisabled();
  }

  await expect(page.locator("body")).not.toContainText(BANNED_INTERNAL_COPY);
}

test.describe("Slice 4 - Profile Management and Role Dashboard Foundation", () => {
  for (const scenario of roleScenarios) {
    test(`${scenario.role} dashboard matches the repaired semantic contract and desktop visual baseline`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 1600 });

      await openDashboardWithMocks(page, scenario);
      await assertDashboardSemantics(page, scenario);

      await expect(page).toHaveScreenshot(scenario.desktopScreenshot, {
        animations: "disabled",
        fullPage: true,
      });

      await assertProfileWorkspace(page, scenario);
    });

    test(`${scenario.role} mobile sidebar preserves the PNG nav set without invented deferred copy`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 });

      await openDashboardWithMocks(page, scenario);
      await page.getByRole("button", { name: /open navigation menu/i }).click();

      const mobileDrawer = page.getByRole("dialog");

      await expect(mobileDrawer).toBeVisible();
      await expect(mobileDrawer.getByRole("link", { name: /^Dashboard$/ })).toBeVisible();

      for (const navLabel of scenario.navLabels) {
        await expect(
          mobileDrawer.getByText(new RegExp(`^${escapeRegex(navLabel)}$`, "i")).first(),
        ).toBeVisible();
      }

      await expect(mobileDrawer).not.toContainText(BANNED_INTERNAL_COPY);
      await expect(page).toHaveScreenshot(scenario.mobileNavScreenshot, {
        animations: "disabled",
        fullPage: true,
      });
    });
  }

  test("buyer shared profile workflow hydrates current-user data and preserves the approved mutation flow", async ({
    page,
  }) => {
    const role: SupportedRole = "buyer";
    const sessionUser = buildSessionUser(role);
    const updatedPhotoUrl = buildMockAvatarUrl(role, "updated");
    const updatedProfileFields = {
      firstName: "Jordan",
      lastName: "Bankole",
      phoneNumber: "+2348098765432",
      address: "25 Updated Profile Street, Abuja",
      dateOfBirth: "1990-05-12",
    };
    let currentUser = { ...sessionUser };
    let profileReadCount = 0;
    let capturedProfileUpdatePayload: Record<string, unknown> | null = null;
    let capturedPasswordPayload: Record<string, unknown> | null = null;
    let capturedUploadBody = "";

    await seedSessionStorage(page, sessionUser);
    await installMockApi(page, {
      role,
      currentUser,
      setCurrentUser: (user) => {
        currentUser = user;
      },
      onProfileRead: () => {
        profileReadCount += 1;
      },
      onProfileUpdate: (payload) => {
        capturedProfileUpdatePayload = payload;
      },
      onPasswordUpdate: (payload) => {
        capturedPasswordPayload = payload;
      },
      onPhotoUpload: (payload) => {
        capturedUploadBody = payload;
      },
    });

    const profileReadResponsePromise = page.waitForResponse(
      (response) =>
        response.url() === `${API_BASE_URL}/auth/profile` &&
        response.request().method() === "GET",
    );

    await page.goto("/dashboard");

    expect((await profileReadResponsePromise).ok()).toBeTruthy();
    expect(profileReadCount).toBeGreaterThan(0);

    await assertDashboardSemantics(page, roleScenarios[0]);
    await assertProfileWorkspace(page, roleScenarios[0]);

    await page.getByRole("button", { name: /Edit Personal Info/i }).click();
    await page.getByLabel("First Name").fill(updatedProfileFields.firstName);
    await page.getByLabel("Last Name").fill(updatedProfileFields.lastName);
    await page.getByLabel("Phone Number").fill(updatedProfileFields.phoneNumber);
    await page.getByLabel("Date of Birth").fill(updatedProfileFields.dateOfBirth);
    await page.getByLabel("Address").fill(updatedProfileFields.address);
    await page.getByRole("button", { name: /Update Personal Information/i }).click();

    expect(capturedProfileUpdatePayload).toEqual(updatedProfileFields);
    await expect(
      page.getByText(/your personal info has been updated succesfully/i),
    ).toBeVisible();

    await page.getByRole("button", { name: /Proceed/i }).click();

    await expect(page.getByText(updatedProfileFields.phoneNumber)).toBeVisible();
    await expect(page.getByText(updatedProfileFields.address)).toBeVisible();
    await expect(
      page.getByText(formatDateLikeUi(`${updatedProfileFields.dateOfBirth}T00:00:00.000Z`)),
    ).toBeVisible();

    const uploadFixturePath = path.resolve(
      process.cwd(),
      "public",
      "images",
      "profile.png",
    );
    await page.locator("input#profilePhoto").setInputFiles(uploadFixturePath);

    expect(capturedUploadBody).toContain('name="photo"');
    expect(capturedUploadBody).not.toContain('name="userId"');
    await expect(page.getByText(/display photo uploaded successfully/i)).toBeVisible();
    await expect(
      page
        .getByRole("img", {
          name: new RegExp(
            `${escapeRegex(updatedProfileFields.firstName)} ${escapeRegex(updatedProfileFields.lastName)}`,
            "i",
          ),
        })
        .first(),
    ).toHaveAttribute("src", new RegExp(escapeRegex(updatedPhotoUrl)));

    await page.getByRole("button", { name: /Password update/i }).click();
    await page.getByLabel("Current password").fill("CurrentPass123!");
    await page.getByLabel("New password").fill("UpdatedPass123!");
    await page.getByLabel("Confirm password").fill("UpdatedPass123!");
    await page.getByRole("button", { name: /Save Password/i }).click();

    expect(capturedPasswordPayload).toEqual({
      currentPassword: "CurrentPass123!",
      newPassword: "UpdatedPass123!",
    });
    await expect(
      page.getByText(/you have successfully updated your password/i),
    ).toBeVisible();
    await expect(page.locator("body")).not.toContainText(BANNED_INTERNAL_COPY);
  });
});
