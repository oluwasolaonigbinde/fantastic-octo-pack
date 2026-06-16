import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const API_BASE_URL =
  process.env.PLAYWRIGHT_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000/api/v1";
const APP_BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

const AUTH_SESSION_STORAGE_KEY = "baiy.auth.session";
const DISTRIBUTOR_ID = "slice-08-distributor-user";
const ADMIN_ID = "slice-08-admin-user";
const ENGINEER_ID = "slice-08-engineer-user";
const DISTRIBUTOR_TOKEN = "slice-08-distributor-access-token";
const ADMIN_TOKEN = "slice-08-admin-access-token";
const ENGINEER_TOKEN = "slice-08-engineer-access-token";

const ok = <T>(message: string, data: T) => ({
  success: true,
  message,
  data,
});

type KycRole = "distributor" | "engineer" | "oem";
type Role = KycRole | "admin";

type SessionUser = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: Role;
  status: "active";
  isEmailVerified: true;
  createdAt: string;
  updatedAt: string;
  kycBadgeLabel?: string;
  engineerTierLabel?: string;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
};

type KycTierDefinition = {
  tierKey: string;
  routeSlug: string;
  tierLabel: string;
  tierOrdinal: number;
  processingTime: string | null;
  isAutoGranted: boolean;
  submissionBehavior: "none" | "auto_approve" | "review_required";
  requiredTextFields: Array<{
    fieldName: string;
    label: string;
    inputType: "text" | "dropdown";
    options?: string[];
  }>;
  requiredDocuments: Array<{
    fieldName: string;
    label: string;
  }>;
  detailTitle: string;
  detailSubtitle: string;
  badgeLabel: string;
};

type KycDocument = {
  fieldName: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  cloudinaryId: string;
  uploadedAt: string;
};

type KycSubmissionRecord = {
  _id: string;
  userId: string;
  userRole: KycRole;
  tierKey: string;
  tierLabel: string;
  routeSlug: string;
  status: "submitted" | "approved" | "rejected";
  textFields: Record<string, string>;
  documents: KycDocument[];
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type Slice8State = {
  nextSubmissionId: number;
  profiles: {
    distributor: SessionUser;
    admin: SessionUser;
    engineer: SessionUser;
  };
  submissions: KycSubmissionRecord[];
  failSubmissionsForTier?: Record<string, string>;
};

const distributorUser: SessionUser = {
  _id: DISTRIBUTOR_ID,
  firstName: "Damilola",
  lastName: "Ade",
  email: "distributor.slice08@example.com",
  phoneNumber: "+2348011111111",
  role: "distributor",
  status: "active",
  isEmailVerified: true,
  createdAt: "2026-04-01T09:00:00.000Z",
  updatedAt: "2026-04-01T09:00:00.000Z",
  kycBadgeLabel: "Basic Seller",
  tokens: {
    accessToken: DISTRIBUTOR_TOKEN,
    refreshToken: "slice-08-distributor-refresh-token",
  },
};

const adminUser: SessionUser = {
  _id: ADMIN_ID,
  firstName: "Ada",
  lastName: "Okonkwo",
  email: "admin.slice08@example.com",
  phoneNumber: "+2348022222222",
  role: "admin",
  status: "active",
  isEmailVerified: true,
  createdAt: "2026-04-01T09:00:00.000Z",
  updatedAt: "2026-04-01T09:00:00.000Z",
  tokens: {
    accessToken: ADMIN_TOKEN,
    refreshToken: "slice-08-admin-refresh-token",
  },
};

const engineerUser: SessionUser = {
  _id: ENGINEER_ID,
  firstName: "Emeka",
  lastName: "Nwosu",
  email: "engineer.slice08@example.com",
  phoneNumber: "+2348033333333",
  role: "engineer",
  status: "active",
  isEmailVerified: true,
  createdAt: "2026-04-01T09:00:00.000Z",
  updatedAt: "2026-04-01T09:00:00.000Z",
  engineerTierLabel: "Unverified",
  kycBadgeLabel: "Unverified",
  tokens: {
    accessToken: ENGINEER_TOKEN,
    refreshToken: "slice-08-engineer-refresh-token",
  },
};

const distributorTiers: KycTierDefinition[] = [
  {
    tierKey: "basic_seller",
    routeSlug: "basic-seller",
    tierLabel: "Basic Seller",
    tierOrdinal: 1,
    processingTime: null,
    isAutoGranted: true,
    submissionBehavior: "auto_approve",
    requiredTextFields: [
      {
        fieldName: "countryOfOrigin",
        label: "Country of Origin",
        inputType: "dropdown",
        options: ["Nigeria"],
      },
    ],
    requiredDocuments: [],
    detailTitle: "Basic seller: uploaded requirement",
    detailSubtitle: "View all uploaded requirement",
    badgeLabel: "Basic Seller",
  },
  {
    tierKey: "registered_seller",
    routeSlug: "registered-seller",
    tierLabel: "Registered Seller",
    tierOrdinal: 2,
    processingTime: "Processing time 24-48 hours",
    isAutoGranted: false,
    submissionBehavior: "review_required",
    requiredTextFields: [
      {
        fieldName: "businessName",
        label: "Business name",
        inputType: "text",
      },
      {
        fieldName: "businessType",
        label: "Business type",
        inputType: "text",
      },
      {
        fieldName: "state",
        label: "State",
        inputType: "dropdown",
        options: ["Lagos", "Abuja"],
      },
      {
        fieldName: "city",
        label: "City",
        inputType: "text",
      },
    ],
    requiredDocuments: [],
    detailTitle: "Registered seller: uploaded requirement",
    detailSubtitle: "View all uploaded requirement",
    badgeLabel: "Registered Seller",
  },
  {
    tierKey: "id_verified",
    routeSlug: "id-verified",
    tierLabel: "ID Verified",
    tierOrdinal: 3,
    processingTime: "Processing time 24-48 hours",
    isAutoGranted: false,
    submissionBehavior: "review_required",
    requiredTextFields: [],
    requiredDocuments: [
      {
        fieldName: "nationalId",
        label: "National ID",
      },
      {
        fieldName: "passportPhoto",
        label: "Image upload",
      },
    ],
    detailTitle: "ID Verified",
    detailSubtitle: "View all uploaded requirement",
    badgeLabel: "ID Verified",
  },
  {
    tierKey: "business_verified",
    routeSlug: "business-verified",
    tierLabel: "Business Verified",
    tierOrdinal: 4,
    processingTime: "Processing time 24-48 hours",
    isAutoGranted: false,
    submissionBehavior: "review_required",
    requiredTextFields: [],
    requiredDocuments: [],
    detailTitle: "Business Verified",
    detailSubtitle: "View all uploaded requirement",
    badgeLabel: "Business Verified",
  },
  {
    tierKey: "platinum_seller",
    routeSlug: "platinum-seller",
    tierLabel: "Platinum Seller",
    tierOrdinal: 5,
    processingTime: "Processing time 24-48 hours",
    isAutoGranted: false,
    submissionBehavior: "review_required",
    requiredTextFields: [],
    requiredDocuments: [],
    detailTitle: "Platinum Seller",
    detailSubtitle: "View all uploaded requirement",
    badgeLabel: "Platinum Seller",
  },
];

const engineerTiers: KycTierDefinition[] = [
  {
    tierKey: "unverified",
    routeSlug: "unverified",
    tierLabel: "Unverified",
    tierOrdinal: 1,
    processingTime: null,
    isAutoGranted: true,
    submissionBehavior: "none",
    requiredTextFields: [],
    requiredDocuments: [],
    detailTitle: "Unverified Engineer requirement",
    detailSubtitle: "View all uploaded requirement",
    badgeLabel: "Unverified",
  },
  {
    tierKey: "basic_engineer",
    routeSlug: "basic-engineer",
    tierLabel: "Basic Engineer",
    tierOrdinal: 2,
    processingTime: "Processing time 24-48 hours",
    isAutoGranted: false,
    submissionBehavior: "review_required",
    requiredTextFields: [
      {
        fieldName: "nin",
        label: "NIN",
        inputType: "text",
      },
    ],
    requiredDocuments: [
      {
        fieldName: "driversLicense",
        label: "Driver's license",
      },
      {
        fieldName: "passportPhotograph",
        label: "Passport photograph",
      },
    ],
    detailTitle: "Basic Engineer uploaded entries",
    detailSubtitle: "View all uploaded requirement",
    badgeLabel: "Basic Engineer",
  },
  {
    tierKey: "verified_engineer",
    routeSlug: "verified-engineer",
    tierLabel: "Verified Engineer",
    tierOrdinal: 3,
    processingTime: "Processing time 24-48 hours",
    isAutoGranted: false,
    submissionBehavior: "review_required",
    requiredTextFields: [],
    requiredDocuments: [
      {
        fieldName: "oemsTrainingCertificate",
        label: "OEMs training certificate",
      },
    ],
    detailTitle: "Verified engineer uploaded entries",
    detailSubtitle: "View all uploaded requirement",
    badgeLabel: "Verified Engineer",
  },
];

const tiersByRole: Record<KycRole, KycTierDefinition[]> = {
  distributor: distributorTiers,
  engineer: engineerTiers,
  oem: [],
};

function cloneUser(user: SessionUser): SessionUser {
  return JSON.parse(JSON.stringify(user)) as SessionUser;
}

function createSlice8State(overrides: Partial<Slice8State> = {}): Slice8State {
  return {
    nextSubmissionId: overrides.nextSubmissionId ?? 1,
    profiles: {
      distributor: cloneUser(distributorUser),
      admin: cloneUser(adminUser),
      engineer: cloneUser(engineerUser),
      ...overrides.profiles,
    },
    submissions: overrides.submissions ?? [],
    failSubmissionsForTier: overrides.failSubmissionsForTier,
  };
}

function buildSubmissionResponse(record: KycSubmissionRecord) {
  return {
    _id: record._id,
    userId: record.userId,
    userRole: record.userRole,
    tierKey: record.tierKey,
    tierLabel: record.tierLabel,
    routeSlug: record.routeSlug,
    status: record.status,
    textFields: record.textFields,
    documents: record.documents,
    rejectionReason: record.rejectionReason,
    reviewedBy: record.reviewedBy,
    reviewedAt: record.reviewedAt,
    submittedAt: record.submittedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function buildAdminRow(record: KycSubmissionRecord) {
  return {
    _id: record._id,
    fullName: `${distributorUser.firstName} ${distributorUser.lastName}`,
    email: distributorUser.email,
    avatarUrl: null,
    kycLevel: record.tierLabel,
    documentSubmitted: `${record.documents.length}/${record.documents.length}`,
    role: "Distributor",
    status:
      record.status === "approved"
        ? "Approved"
        : record.status === "rejected"
          ? "Rejected"
          : "Pending",
    registrationDate: record.createdAt,
    createdAt: record.createdAt,
  };
}

function buildAdminDetail(record: KycSubmissionRecord) {
  const requestStatusLabel =
    record.status === "approved"
      ? "Approved"
      : record.status === "rejected"
        ? "Rejected"
        : "Pending";

  return {
    ...buildSubmissionResponse(record),
    user: {
      _id: distributorUser._id,
      firstName: distributorUser.firstName,
      lastName: distributorUser.lastName,
      email: distributorUser.email,
      role: distributorUser.role,
      displayPhoto: null,
    },
    reviewer:
      record.reviewedBy === ADMIN_ID
        ? {
            _id: adminUser._id,
            firstName: adminUser.firstName,
            lastName: adminUser.lastName,
            email: adminUser.email,
            role: adminUser.role,
          }
        : null,
    requestStatusLabel,
  };
}

function getUserFromToken(state: Slice8State, authorizationHeader: string | null) {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorizationHeader.replace("Bearer ", "");

  if (token === DISTRIBUTOR_TOKEN) {
    return state.profiles.distributor;
  }

  if (token === ADMIN_TOKEN) {
    return state.profiles.admin;
  }

  if (token === ENGINEER_TOKEN) {
    return state.profiles.engineer;
  }

  return null;
}

function getKycRoleForSession(sessionUser: SessionUser | null): KycRole {
  return sessionUser?.role && sessionUser.role !== "admin"
    ? sessionUser.role
    : "distributor";
}

async function seedSession(page: Page, user: SessionUser) {
  await page.addInitScript(
    ([storageKey, serializedUser]) => {
      window.localStorage.setItem(storageKey, serializedUser);
    },
    [AUTH_SESSION_STORAGE_KEY, JSON.stringify(user)],
  );
}

async function selectOptionByLabel(page: Page, label: string, option: string) {
  const field = page
    .locator("div")
    .filter({
      has: page.locator("label", { hasText: label }),
    })
    .filter({
      has: page.locator('button[role="combobox"]'),
    })
    .first();

  await field.locator('button[role="combobox"]').click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

async function installSlice8Api(context: BrowserContext, state: Slice8State) {
  await context.route(`${API_BASE_URL}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const requestPath = url.pathname.replace(/^\/api\/v1/, "");
    const sessionUser = getUserFromToken(
      state,
      request.headers().authorization ?? null,
    );

    if (requestPath === "/auth/profile" && method === "GET") {
      const user = sessionUser ?? state.profiles.distributor;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("Profile fetched successfully", {
            ...user,
            tokens: undefined,
          }),
        ),
      });
      return;
    }

    if (requestPath === "/kyc/tiers" && method === "GET") {
      const role = getKycRoleForSession(sessionUser);

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("KYC tiers fetched successfully", tiersByRole[role])),
      });
      return;
    }

    if (requestPath === "/kyc/submissions" && method === "GET") {
      const role = getKycRoleForSession(sessionUser);
      const submissions = state.submissions
        .filter((submission) => submission.userRole === role)
        .map(buildSubmissionResponse);

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("KYC submissions fetched successfully", submissions)),
      });
      return;
    }

    if (requestPath === "/kyc/submissions" && method === "POST") {
      const payload = request.postDataJSON() as {
        tierKey: string;
        textFields?: Record<string, string>;
        documents?: KycDocument[];
      };
      const role = getKycRoleForSession(sessionUser);
      const tier = tiersByRole[role].find((entry) => entry.tierKey === payload.tierKey);

      if (!tier) {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            message: "Invalid KYC tier for this role",
            data: null,
          }),
        });
        return;
      }

      const failureMessage = state.failSubmissionsForTier?.[tier.tierKey];
      if (failureMessage) {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            message: failureMessage,
            data: null,
          }),
        });
        return;
      }

      const now = new Date(
        `2026-04-04T10:${String(state.nextSubmissionId).padStart(2, "0")}:00.000Z`,
      ).toISOString();
      const submission: KycSubmissionRecord = {
        _id: `slice-08-submission-${state.nextSubmissionId++}`,
        userId: sessionUser?._id ?? DISTRIBUTOR_ID,
        userRole: role,
        tierKey: tier.tierKey,
        tierLabel: tier.tierLabel,
        routeSlug: tier.routeSlug,
        status: tier.submissionBehavior === "auto_approve" ? "approved" : "submitted",
        textFields: payload.textFields ?? {},
        documents: (payload.documents ?? []).map((document) => ({
          ...document,
          uploadedAt: now,
        })),
        rejectionReason: null,
        reviewedBy: null,
        reviewedAt: null,
        submittedAt: now,
        createdAt: now,
        updatedAt: now,
      };

      state.submissions.push(submission);

      if (role === "distributor" && tier.tierKey === "basic_seller") {
        state.profiles.distributor.kycBadgeLabel = "Basic Seller";
      }

      await route.fulfill({
        status: tier.submissionBehavior === "auto_approve" ? 200 : 201,
        contentType: "application/json",
        body: JSON.stringify(
          ok("KYC submission created successfully", buildSubmissionResponse(submission)),
        ),
      });
      return;
    }

    if (requestPath === "/kyc/upload" && method === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("KYC document uploaded successfully", {
            fileUrl: "https://example.com/kyc/document.pdf",
            cloudinaryId: "slice-08-cloudinary-doc",
            fileName: "national-id.pdf",
            fileType: "application/pdf",
          }),
        ),
      });
      return;
    }

    if (requestPath === "/kyc/admin/stats" && method === "GET") {
      const approvedUsers = new Set(
        state.submissions
          .filter((submission) => submission.status === "approved")
          .map((submission) => submission.userId),
      );

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("Admin KYC stats fetched successfully", {
            totalVerifiedUsers: approvedUsers.size,
            pendingKycReviews: state.submissions.filter(
              (submission) => submission.status === "submitted",
            ).length,
            rejectedSubmissions: state.submissions.filter(
              (submission) => submission.status === "rejected",
            ).length,
            verificationFlagged: 0,
          }),
        ),
      });
      return;
    }

    if (requestPath === "/kyc/admin/submissions" && method === "GET") {
      const rows = state.submissions
        .filter((submission) => submission.status === "submitted")
        .map(buildAdminRow);

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Admin KYC submissions fetched successfully", rows)),
      });
      return;
    }

    if (requestPath.startsWith("/kyc/admin/submissions/") && method === "GET") {
      const submissionId = requestPath.split("/").at(-1) || "";
      const submission = state.submissions.find((entry) => entry._id === submissionId);

      await route.fulfill({
        status: submission ? 200 : 404,
        contentType: "application/json",
        body: JSON.stringify(
          submission
            ? ok("KYC submission fetched successfully", buildAdminDetail(submission))
            : { success: false, message: "KYC submission not found", data: null },
        ),
      });
      return;
    }

    if (
      requestPath.startsWith("/kyc/admin/submissions/") &&
      requestPath.endsWith("/approve") &&
      method === "PATCH"
    ) {
      const submissionId = requestPath.split("/")[4];
      const submission = state.submissions.find((entry) => entry._id === submissionId);

      if (!submission) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            message: "KYC submission not found",
            data: null,
          }),
        });
        return;
      }

      submission.status = "approved";
      submission.reviewedBy = ADMIN_ID;
      submission.reviewedAt = "2026-04-04T12:00:00.000Z";
      submission.updatedAt = "2026-04-04T12:00:00.000Z";
      state.profiles.distributor.kycBadgeLabel = submission.tierLabel;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("KYC submission approved successfully", buildAdminDetail(submission)),
        ),
      });
      return;
    }

    if (
      requestPath.startsWith("/kyc/admin/submissions/") &&
      requestPath.endsWith("/reject") &&
      method === "PATCH"
    ) {
      const submissionId = requestPath.split("/")[4];
      const submission = state.submissions.find((entry) => entry._id === submissionId);
      const payload = request.postDataJSON() as { rejectionReason?: string };

      if (!submission) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            message: "KYC submission not found",
            data: null,
          }),
        });
        return;
      }

      submission.status = "rejected";
      submission.rejectionReason = payload.rejectionReason || "Submitted details need correction.";
      submission.reviewedBy = ADMIN_ID;
      submission.reviewedAt = "2026-04-04T12:30:00.000Z";
      submission.updatedAt = "2026-04-04T12:30:00.000Z";

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("KYC submission rejected successfully", buildAdminDetail(submission)),
        ),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(ok("Mocked response", {})),
    });
  });
}

test.describe("Slice 8 - KYC Document Submission and Administrative Review", () => {
  test("Primary user path: Distributor submits KYC, Admin approves, tier updates", async ({
    browser,
    page,
  }) => {
    const state: Slice8State = {
      nextSubmissionId: 1,
      profiles: {
        distributor: cloneUser(distributorUser),
        admin: cloneUser(adminUser),
        engineer: cloneUser(engineerUser),
      },
      submissions: [],
    };

    await seedSession(page, state.profiles.distributor);
    await installSlice8Api(page.context(), state);

    await page.goto(`${APP_BASE_URL}/dashboard/distributor/kyc-verification`);

    await expect(
      page.getByRole("heading", { name: "KYC Verification", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Account Tiers", exact: true }),
    ).toBeVisible();
    const basicSellerCard = page
      .getByRole("article")
      .filter({ has: page.getByText("Basic Seller", { exact: true }) });
    const registeredSellerCard = page
      .getByRole("article")
      .filter({ has: page.getByText("Registered Seller", { exact: true }) });
    const initialIdVerifiedCard = page
      .getByRole("article")
      .filter({ has: page.getByText("ID Verified", { exact: true }) });

    await expect(basicSellerCard).toBeVisible();
    await expect(registeredSellerCard).toBeVisible();
    await expect(initialIdVerifiedCard).toBeVisible();

    await basicSellerCard.getByRole("link", { name: "See details", exact: true }).click();

    await expect(page).toHaveURL(/\/dashboard\/distributor\/kyc-verification\/basic-seller$/);
    await expect(
      page.getByRole("heading", {
        name: "Basic seller: uploaded requirement",
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByText("Complete Your KYC Registration")).toBeVisible();
    await expect(page.getByText("Country of Origin", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Next", exact: true }).click();

    await expect(page).toHaveURL(
      /\/dashboard\/distributor\/kyc-verification\/registered-seller$/,
    );
    await expect(
      page.getByRole("heading", {
        name: "Registered seller: uploaded requirement",
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Upgrade", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Upgrade", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    const dialog = page.getByRole("dialog");
    await dialog.locator("input").nth(0).fill("Lifeline Diagnostics");
    await dialog.locator("input").nth(1).fill("Medical supplier");
    await selectOptionByLabel(page, "State", "Lagos");
    await dialog.locator("input").nth(2).fill("Ikeja");
    await dialog.getByRole("button", { name: "Submit", exact: true }).click();

    await expect(page.getByText("Pending approval", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Business name")).toBeVisible();
    await expect(page.getByText("Lifeline Diagnostics")).toBeVisible();
    await expect(page.getByText("Medical supplier")).toBeVisible();
    await expect(page.getByText("Ikeja")).toBeVisible();

    const adminContext = await browser.newContext();
    await installSlice8Api(adminContext, state);
    const adminPage = await adminContext.newPage();
    await seedSession(adminPage, state.profiles.admin);
    await adminPage.goto(`${APP_BASE_URL}/dashboard/admin/kyc-verification`);

    await expect(
      adminPage.getByRole("heading", { name: "KYC Management", exact: true }),
    ).toBeVisible();
    await expect(adminPage.getByText("All KYC Verification Requests")).toBeVisible();
    await expect(adminPage.getByText("Lifeline Diagnostics")).not.toBeVisible();
    await expect(
      adminPage.locator("table").getByText("Registered Seller", { exact: true }),
    ).toBeVisible();
    await expect(
      adminPage.locator("table").getByText("Pending", { exact: true }),
    ).toBeVisible();

    await adminPage.getByRole("button", { name: "View", exact: true }).click();
    const adminDrawer = adminPage.getByRole("dialog");
    await expect(adminDrawer.getByText("KYC request details", { exact: true })).toBeVisible();
    await expect(adminDrawer.getByText("Request Status")).toBeVisible();
    await expect(adminDrawer.getByText("Pending", { exact: true })).toBeVisible();
    const adminDrawerText = await adminDrawer.textContent();
    expect(adminDrawerText).toContain("Business name: Lifeline Diagnostics");
    expect(adminDrawerText).toContain("Business type: Medical supplier");
    expect(adminDrawerText).toContain("State: Lagos");
    expect(adminDrawerText).toContain("City: Ikeja");

    await adminPage.getByRole("button", { name: "Approve", exact: true }).click();
    await expect(adminDrawer.getByText("Approved", { exact: true })).toBeVisible();

    const distributorReturnContext = await browser.newContext();
    await installSlice8Api(distributorReturnContext, state);
    const distributorReturnPage = await distributorReturnContext.newPage();
    await seedSession(distributorReturnPage, state.profiles.distributor);
    await distributorReturnPage.goto(
      `${APP_BASE_URL}/dashboard/distributor/kyc-verification`,
    );

    await expect(
      distributorReturnPage
        .locator("nav")
        .getByText("Registered Seller", { exact: true })
        .first(),
    ).toBeVisible();
    await expect(
      distributorReturnPage
        .getByRole("article")
        .filter({
          has: distributorReturnPage.getByText("ID Verified", { exact: true }),
        }),
    ).toBeVisible();

    await distributorReturnPage
      .getByRole("article")
      .filter({
        has: distributorReturnPage.getByText("Registered Seller", { exact: true }),
      })
      .getByRole("link", { name: "See details", exact: true })
      .click();

    await expect(distributorReturnPage).toHaveURL(
      /\/dashboard\/distributor\/kyc-verification\/registered-seller$/,
    );
    await expect(
      distributorReturnPage.getByText("Approved", { exact: true }).first(),
    ).toBeVisible();
    await expect(distributorReturnPage.getByText("Lifeline Diagnostics")).toBeVisible();

    await distributorReturnPage.goBack();
    await expect(distributorReturnPage).toHaveURL(
      /\/dashboard\/distributor\/kyc-verification$/,
    );

    const idVerifiedCard = distributorReturnPage
      .getByRole("article")
      .filter({
        has: distributorReturnPage.getByText("ID Verified", { exact: true }),
      });
    await expect(
      idVerifiedCard.getByRole("link", { name: "See details", exact: true }),
    ).toBeVisible();

    await distributorReturnPage.goto(
      `${APP_BASE_URL}/dashboard/distributor/kyc-verification/id-verified`,
    );
    await expect(
      distributorReturnPage.getByRole("button", { name: "Upgrade", exact: true }),
    ).toBeVisible();

    const bodyText = await distributorReturnPage.textContent("body");
    expect(bodyText).not.toContain("TODO");

    await adminContext.close();
    await distributorReturnContext.close();
  });

  test("Distributor rejected submission refreshes in-place and can be resubmitted", async ({
    page,
  }) => {
    const submittedAt = "2026-04-04T10:10:00.000Z";
    const state = createSlice8State({
      nextSubmissionId: 11,
      submissions: [
        {
          _id: "slice-08-basic-approved",
          userId: DISTRIBUTOR_ID,
          userRole: "distributor",
          tierKey: "basic_seller",
          tierLabel: "Basic Seller",
          routeSlug: "basic-seller",
          status: "approved",
          textFields: { countryOfOrigin: "Nigeria" },
          documents: [],
          rejectionReason: null,
          reviewedBy: ADMIN_ID,
          reviewedAt: "2026-04-04T09:00:00.000Z",
          submittedAt: "2026-04-04T08:59:00.000Z",
          createdAt: "2026-04-04T08:59:00.000Z",
          updatedAt: "2026-04-04T09:00:00.000Z",
        },
        {
          _id: "slice-08-registered-pending",
          userId: DISTRIBUTOR_ID,
          userRole: "distributor",
          tierKey: "registered_seller",
          tierLabel: "Registered Seller",
          routeSlug: "registered-seller",
          status: "submitted",
          textFields: {
            businessName: "Lifeline Diagnostics",
            businessType: "Medical supplier",
            state: "Lagos",
            city: "Ikeja",
          },
          documents: [],
          rejectionReason: null,
          reviewedBy: null,
          reviewedAt: null,
          submittedAt,
          createdAt: submittedAt,
          updatedAt: submittedAt,
        },
      ],
    });

    await seedSession(page, state.profiles.distributor);
    await installSlice8Api(page.context(), state);
    await page.goto(`${APP_BASE_URL}/dashboard/distributor/kyc-verification/registered-seller`);

    await expect(page.getByText("Pending approval", { exact: true }).first()).toBeVisible();

    const pendingSubmission = state.submissions.find(
      (submission) => submission._id === "slice-08-registered-pending",
    );
    expect(pendingSubmission).toBeTruthy();
    pendingSubmission!.status = "rejected";
    pendingSubmission!.rejectionReason = "Business address could not be verified.";
    pendingSubmission!.reviewedBy = ADMIN_ID;
    pendingSubmission!.reviewedAt = "2026-04-04T12:30:00.000Z";
    pendingSubmission!.updatedAt = "2026-04-04T12:30:00.000Z";

    await page.evaluate(() => window.dispatchEvent(new Event("focus")));

    await expect(page.getByText("Rejected", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Business address could not be verified.")).toBeVisible();
    await page.getByRole("button", { name: "Submit again", exact: true }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.locator("input").nth(0).fill("Lifeline Diagnostics Updated");
    await dialog.locator("input").nth(1).fill("Medical supplier");
    await selectOptionByLabel(page, "State", "Lagos");
    await dialog.locator("input").nth(2).fill("Ikeja");
    await dialog.getByRole("button", { name: "Submit", exact: true }).click();

    await expect(page.getByText("Pending approval", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Lifeline Diagnostics Updated")).toBeVisible();
  });

  test("Distributor Basic Seller failed submit stays on Basic Seller", async ({ page }) => {
    const state = createSlice8State({
      failSubmissionsForTier: {
        basic_seller: "Country of Origin must be one of the configured options",
      },
    });

    await seedSession(page, state.profiles.distributor);
    await installSlice8Api(page.context(), state);
    await page.goto(`${APP_BASE_URL}/dashboard/distributor/kyc-verification/basic-seller`);

    await page.getByRole("button", { name: "Next", exact: true }).click();

    await expect(page).toHaveURL(/\/dashboard\/distributor\/kyc-verification\/basic-seller$/);
    await expect(
      page.getByText("Country of Origin must be one of the configured options"),
    ).toBeVisible();
  });

  test("Engineer rejected tier is recovered from the shared Upgrade CTA", async ({ page }) => {
    const state = createSlice8State({
      submissions: [
        {
          _id: "slice-08-engineer-basic-rejected",
          userId: ENGINEER_ID,
          userRole: "engineer",
          tierKey: "basic_engineer",
          tierLabel: "Basic Engineer",
          routeSlug: "basic-engineer",
          status: "rejected",
          textFields: { nin: "12345678901" },
          documents: [
            {
              fieldName: "driversLicense",
              fileName: "drivers-license.pdf",
              fileType: "application/pdf",
              fileUrl: "https://example.com/kyc/drivers-license.pdf",
              cloudinaryId: "slice-08-engineer-license",
              uploadedAt: "2026-04-04T10:00:00.000Z",
            },
            {
              fieldName: "passportPhotograph",
              fileName: "passport-photo.png",
              fileType: "image/png",
              fileUrl: "https://example.com/kyc/passport-photo.png",
              cloudinaryId: "slice-08-engineer-photo",
              uploadedAt: "2026-04-04T10:00:00.000Z",
            },
          ],
          rejectionReason: "Passport photograph is blurry.",
          reviewedBy: ADMIN_ID,
          reviewedAt: "2026-04-04T12:00:00.000Z",
          submittedAt: "2026-04-04T10:00:00.000Z",
          createdAt: "2026-04-04T10:00:00.000Z",
          updatedAt: "2026-04-04T12:00:00.000Z",
        },
      ],
    });

    await seedSession(page, state.profiles.engineer);
    await installSlice8Api(page.context(), state);
    await page.goto(`${APP_BASE_URL}/dashboard/engineer/kyc-verification`);

    await page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: "Account Tiers", exact: true }) })
      .getByRole("link", { name: "Upgrade", exact: true })
      .click();

    await expect(page).toHaveURL(/\/dashboard\/engineer\/kyc-verification\/basic-engineer$/);
    await expect(page.getByText("Passport photograph is blurry.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit again", exact: true })).toBeVisible();
    await expect(page.getByText("Badge", { exact: true })).not.toBeVisible();
  });
});
