import { expect, test, type Page } from "@playwright/test";

const API_BASE_URL =
  process.env.PLAYWRIGHT_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000/api/v1";

const AUTH_SESSION_STORAGE_KEY = "baiy.auth.session";
const PENDING_AUTH_INTENT_STORAGE_KEY = "baiy.auth.pending-intent";
const ENGINEER_ID = "slice-07-engineer-user";
const BUYER_ID = "slice-07-buyer-user";
const ADMIN_ID = "slice-07-admin-user";
const SLICE_SCAFFOLD_MARKER = "TODO" + "_SLICE_IMPLEMENTATION";

const BANNED_INTERNAL_COPY =
  new RegExp(`\\b(?:Slice 7|${SLICE_SCAFFOLD_MARKER}|Deferred|foundation)\\b`, "i");
const BANNED_ORDER_DISPUTE_COPY =
  /\b(?:Order ID|Payment type|ESCROW|Refund buyer)\b/i;

const ok = (message: string, data: unknown) => ({
  success: true,
  message,
  data,
});

type Role = "buyer" | "engineer" | "admin";

type SessionUser = ReturnType<typeof buildSessionUser>;
type ServiceRequestRecord = {
  _id: string;
  jobType: string;
  equipmentName: string;
  brand?: string;
  model?: string;
  serviceLocation?: string;
  preferredDate: string;
  preferredTime?: string;
  serviceDescription: string;
  requester: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
  };
  engineer: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
  };
  status:
    | "pending"
    | "accepted"
    | "rejected"
    | "in_progress"
    | "completed"
    | "closed_after_dispute";
  price?: number;
  unitPrice?: number;
  disputeActive: boolean;
  activeDisputeId?: string;
  activeDisputeStatus?: "under_review" | "awaiting_evidence" | "resolved";
  proofOfCompletion?: {
    url: string;
    cloudinary_id: string;
    fileName: string;
  };
  photos: Array<{ url: string; cloudinary_id: string }>;
  createdAt: string;
  updatedAt: string;
};

type ServiceDisputeRecord = {
  _id: string;
  serviceRequest: ServiceRequestRecord;
  buyer: ServiceRequestRecord["requester"];
  engineer: ServiceRequestRecord["engineer"];
  reason: string;
  description: string;
  status: "under_review" | "awaiting_evidence" | "resolved";
  resolutionOutcome?:
    | "continue_service"
    | "mark_completed"
    | "closed_after_dispute";
  resolutionNote?: string;
  evidence: Array<{
    url: string;
    cloudinary_id: string;
    fileName: string;
    mimeType?: string;
    createdAt: string;
  }>;
  comments: Array<{
    author: ServiceRequestRecord["requester"] | ServiceRequestRecord["engineer"] | SessionUser;
    authorRole: string;
    text: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

type Slice7State = {
  serviceRequests: ServiceRequestRecord[];
  disputes: ServiceDisputeRecord[];
};

const buyerUser = buildSessionUser("buyer");
const engineerUser = buildSessionUser("engineer");
const adminUser = buildSessionUser("admin");

const publicEngineerProfile = {
  _id: ENGINEER_ID,
  firstName: "Samuel",
  lastName: "Smart",
  address: "Lagos, Nigeria",
  displayPhoto: {
    url: "/images/profile.png",
    cloudinary_id: "engineer-profile-photo",
  },
  role: "engineer",
  specializations: ["Installation", "Maintenance"],
  equipmentTypes: ["Ultrasound Machine", "MRI Machine"],
  experienceYears: 8,
  rating: 4.8,
  reviewCount: 0,
  bio: "Experienced biomedical service engineer.",
  oemTags: ["Philips", "GE"],
  oemCertified: true,
  engineerAvailability: "available",
};

function buildSessionUser(role: Role) {
  if (role === "buyer") {
    return {
      _id: BUYER_ID,
      firstName: "Amina",
      lastName: "Bello",
      email: "buyer.slice07@example.com",
      phoneNumber: "+2348012345678",
      role,
      status: "active",
      isEmailVerified: true,
      createdAt: "2026-04-01T09:00:00.000Z",
      updatedAt: "2026-04-01T09:00:00.000Z",
      tokens: {
        accessToken: "slice-07-buyer-access-token",
        refreshToken: "slice-07-buyer-refresh-token",
      },
    };
  }

  if (role === "engineer") {
    return {
      _id: ENGINEER_ID,
      firstName: "Samuel",
      lastName: "Smart",
      email: "engineer.slice07@example.com",
      phoneNumber: "+2348099999999",
      role,
      status: "active",
      isEmailVerified: true,
      createdAt: "2026-04-01T09:00:00.000Z",
      updatedAt: "2026-04-01T09:00:00.000Z",
      tokens: {
        accessToken: "slice-07-engineer-access-token",
        refreshToken: "slice-07-engineer-refresh-token",
      },
    };
  }

  return {
    _id: ADMIN_ID,
    firstName: "Otor",
    lastName: "John Stephen",
    email: "admin.slice07@example.com",
    phoneNumber: "+2348030000000",
    role,
    status: "active",
    isEmailVerified: true,
    createdAt: "2026-04-01T09:00:00.000Z",
    updatedAt: "2026-04-01T09:00:00.000Z",
    tokens: {
      accessToken: "slice-07-admin-access-token",
      refreshToken: "slice-07-admin-refresh-token",
    },
  };
}

function buildServiceRequest(
  overrides: Partial<ServiceRequestRecord> = {},
): ServiceRequestRecord {
  return {
    _id: "slice-07-request-1",
    jobType: "Installation",
    equipmentName: "Philips Ultrasound Machine",
    brand: "Philips",
    model: "EPIQ 7",
    serviceLocation: "",
    preferredDate: "2026-04-10T00:00:00.000Z",
    preferredTime: "Morning (8:00 AM - 12:00 PM)",
    serviceDescription:
      "Install and calibrate the ultrasound unit for the imaging suite.",
    requester: {
      _id: BUYER_ID,
      firstName: "Amina",
      lastName: "Bello",
      email: "buyer.slice07@example.com",
      phoneNumber: "+2348012345678",
    },
    engineer: {
      _id: ENGINEER_ID,
      firstName: "Samuel",
      lastName: "Smart",
      email: "engineer.slice07@example.com",
      phoneNumber: "+2348099999999",
    },
    status: "pending",
    price: undefined,
    unitPrice: undefined,
    disputeActive: false,
    activeDisputeId: undefined,
    activeDisputeStatus: undefined,
    proofOfCompletion: undefined,
    photos: [],
    createdAt: "2026-04-04T10:30:00.000Z",
    updatedAt: "2026-04-04T10:30:00.000Z",
    ...overrides,
  };
}

function buildServiceDispute(
  serviceRequest: ServiceRequestRecord,
  overrides: Partial<ServiceDisputeRecord> = {},
): ServiceDisputeRecord {
  return {
    _id: "slice-07-dispute-1",
    serviceRequest,
    buyer: serviceRequest.requester,
    engineer: serviceRequest.engineer,
    reason: "Installation incomplete",
    description:
      "The engineer left before the calibration checklist was completed.",
    status: "under_review",
    resolutionOutcome: undefined,
    resolutionNote: undefined,
    evidence: [
      {
        url: "https://example.com/attached-document.pdf",
        cloudinary_id: "slice-07-evidence-1",
        fileName: "attached-document.pdf",
        mimeType: "application/pdf",
        createdAt: "2026-04-04T12:00:00.000Z",
      },
    ],
    comments: [],
    createdAt: "2026-04-04T12:00:00.000Z",
    updatedAt: "2026-04-04T12:00:00.000Z",
    ...overrides,
  };
}

async function seedSession(page: Page, user: SessionUser) {
  await page.addInitScript(
    ([storageKey, serializedUser]) => {
      window.localStorage.setItem(storageKey, serializedUser);
    },
    [AUTH_SESSION_STORAGE_KEY, JSON.stringify(user)],
  );
}

async function readPendingAuthIntent(page: Page) {
  return page.evaluate((storageKey) => {
    return window.sessionStorage.getItem(storageKey);
  }, PENDING_AUTH_INTENT_STORAGE_KEY);
}

async function installSlice7Api(
  page: Page,
  options: {
    state: Slice7State;
    sessionUser?: SessionUser;
    loginUser?: SessionUser;
  },
) {
  let currentUser = options.sessionUser ?? options.loginUser ?? null;
  let createCounter = options.state.serviceRequests.length + 1;
  let disputeCounter = options.state.disputes.length + 1;

  const findRequest = (id: string) =>
    options.state.serviceRequests.find((request) => request._id === id);
  const findDispute = (id: string) =>
    options.state.disputes.find((dispute) => dispute._id === id);

  await page.route(`${API_BASE_URL}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const path = url.pathname.replace(/^\/api\/v1/, "");

    if (path === "/auth/login" && method === "POST") {
      currentUser = options.loginUser ?? buyerUser;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Login successful", currentUser)),
      });
      return;
    }

    if (path === "/auth/profile" && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("Profile fetched successfully", {
            ...(currentUser ?? options.sessionUser ?? buyerUser),
            tokens: undefined,
          }),
        ),
      });
      return;
    }

    if (path === `/public/profiles/${ENGINEER_ID}` && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("Public profile fetched successfully", publicEngineerProfile),
        ),
      });
      return;
    }

    if (path === `/reviews/engineer/${ENGINEER_ID}` && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Engineer reviews fetched successfully", [])),
      });
      return;
    }

    if (path === "/service-requests" && method === "GET") {
      const visibleRequests = options.state.serviceRequests.filter((serviceRequest) => {
        if (!currentUser) {
          return false;
        }

        if (currentUser.role === "buyer") {
          return serviceRequest.requester._id === currentUser._id;
        }

        if (currentUser.role === "engineer") {
          return serviceRequest.engineer._id === currentUser._id;
        }

        return false;
      });

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Service requests fetched successfully", visibleRequests)),
      });
      return;
    }

    if (path === "/admin/service-requests" && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("Admin service requests fetched successfully", options.state.serviceRequests),
        ),
      });
      return;
    }

    if (path.startsWith("/admin/service-requests/") && method === "GET") {
      const serviceRequest = findRequest(path.split("/").at(-1) || "");

      await route.fulfill({
        status: serviceRequest ? 200 : 404,
        contentType: "application/json",
        body: JSON.stringify(
          serviceRequest
            ? ok("Admin service request fetched successfully", serviceRequest)
            : { success: false, message: "Service request not found", data: null },
        ),
      });
      return;
    }

    if (path === "/service-requests" && method === "POST") {
      const payload = request.postDataJSON() as Record<string, string>;
      const createdRequest = buildServiceRequest({
        _id: `slice-07-request-${createCounter++}`,
        jobType: payload.jobType,
        equipmentName: payload.equipmentName,
        model: payload.model,
        preferredDate: payload.preferredDate,
        preferredTime: payload.preferredTime,
        serviceDescription: payload.serviceDescription,
        requester: {
          _id: BUYER_ID,
          firstName: buyerUser.firstName,
          lastName: buyerUser.lastName,
          email: buyerUser.email,
          phoneNumber: buyerUser.phoneNumber,
        },
      });

      options.state.serviceRequests.unshift(createdRequest);

      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(ok("Service request created successfully", createdRequest)),
      });
      return;
    }

    if (path.startsWith("/service-requests/") && path.endsWith("/status") && method === "PATCH") {
      const requestId = path.split("/")[2];
      const serviceRequest = findRequest(requestId);
      const payload = request.postDataJSON() as {
        status: ServiceRequestRecord["status"];
        price?: number;
        unitPrice?: number;
      };

      if (!serviceRequest) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            message: "Service request not found",
            data: null,
          }),
        });
        return;
      }

      serviceRequest.status = payload.status;
      serviceRequest.price = payload.price ?? serviceRequest.price;
      serviceRequest.unitPrice = payload.unitPrice ?? serviceRequest.unitPrice;
      serviceRequest.updatedAt = "2026-04-04T13:00:00.000Z";

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("Service request status updated successfully", serviceRequest),
        ),
      });
      return;
    }

    if (
      path.startsWith("/service-requests/") &&
      path.endsWith("/buyer-complete") &&
      method === "PATCH"
    ) {
      const requestId = path.split("/")[2];
      const serviceRequest = findRequest(requestId);

      if (!serviceRequest) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            message: "Service request not found",
            data: null,
          }),
        });
        return;
      }

      serviceRequest.status = "completed";
      serviceRequest.updatedAt = "2026-04-04T14:00:00.000Z";

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Service request marked as completed", serviceRequest)),
      });
      return;
    }

    if (
      path.startsWith("/service-requests/") &&
      path.endsWith("/disputes") &&
      method === "POST"
    ) {
      const requestId = path.split("/")[2];
      const serviceRequest = findRequest(requestId);
      const payload = request.postDataJSON() as {
        reason: string;
        description: string;
      };

      if (!serviceRequest) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            message: "Service request not found",
            data: null,
          }),
        });
        return;
      }

      const dispute = buildServiceDispute(serviceRequest, {
        _id: `slice-07-dispute-${disputeCounter++}`,
        reason: payload.reason,
        description: payload.description,
        evidence: [],
      });

      serviceRequest.disputeActive = true;
      serviceRequest.activeDisputeId = dispute._id;
      serviceRequest.activeDisputeStatus = dispute.status;
      serviceRequest.updatedAt = "2026-04-04T14:15:00.000Z";
      options.state.disputes.unshift(dispute);

      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(
          ok("Service dispute created successfully", {
            dispute,
            serviceRequest,
          }),
        ),
      });
      return;
    }

    if (
      (path === "/service-disputes" || path === "/admin/service-disputes") &&
      method === "GET"
    ) {
      const visibleDisputes =
        path === "/admin/service-disputes"
          ? options.state.disputes
          : options.state.disputes.filter((dispute) => {
              if (!currentUser) {
                return false;
              }

              return (
                dispute.buyer._id === currentUser._id ||
                dispute.engineer._id === currentUser._id
              );
            });

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Service disputes fetched successfully", visibleDisputes)),
      });
      return;
    }

    if (
      (path.startsWith("/service-disputes/") || path.startsWith("/admin/service-disputes/")) &&
      method === "GET"
    ) {
      const disputeId = path.split("/").at(-1) || "";
      const dispute = findDispute(disputeId);

      await route.fulfill({
        status: dispute ? 200 : 404,
        contentType: "application/json",
        body: JSON.stringify(
          dispute
            ? ok("Service dispute fetched successfully", dispute)
            : { success: false, message: "Service dispute not found", data: null },
        ),
      });
      return;
    }

    if (path.startsWith("/service-disputes/") && path.endsWith("/comments") && method === "POST") {
      const disputeId = path.split("/")[2];
      const dispute = findDispute(disputeId);
      const payload = request.postDataJSON() as { text: string };

      if (!dispute || !currentUser) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            message: "Service dispute not found",
            data: null,
          }),
        });
        return;
      }

      dispute.comments.push({
        author: currentUser,
        authorRole: currentUser.role,
        text: payload.text,
        createdAt: "2026-04-04T14:30:00.000Z",
      });
      dispute.updatedAt = "2026-04-04T14:30:00.000Z";

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Comment added successfully", dispute)),
      });
      return;
    }

    if (
      path.startsWith("/service-disputes/") &&
      path.endsWith("/request-evidence") &&
      method === "POST"
    ) {
      const disputeId = path.split("/")[2];
      const dispute = findDispute(disputeId);
      const serviceRequest = dispute ? findRequest(dispute.serviceRequest._id) : undefined;

      if (!dispute || !serviceRequest) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            message: "Service dispute not found",
            data: null,
          }),
        });
        return;
      }

      dispute.status = "awaiting_evidence";
      dispute.updatedAt = "2026-04-04T14:45:00.000Z";
      serviceRequest.activeDisputeStatus = "awaiting_evidence";

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("More evidence requested successfully", {
            dispute,
            serviceRequest,
          }),
        ),
      });
      return;
    }

    if (
      path.startsWith("/service-disputes/") &&
      path.endsWith("/resolve") &&
      method === "POST"
    ) {
      const disputeId = path.split("/")[2];
      const dispute = findDispute(disputeId);
      const serviceRequest = dispute ? findRequest(dispute.serviceRequest._id) : undefined;
      const payload = request.postDataJSON() as {
        resolutionOutcome: ServiceDisputeRecord["resolutionOutcome"];
      };

      if (!dispute || !serviceRequest) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            message: "Service dispute not found",
            data: null,
          }),
        });
        return;
      }

      dispute.status = "resolved";
      dispute.resolutionOutcome = payload.resolutionOutcome;
      dispute.updatedAt = "2026-04-04T15:00:00.000Z";

      serviceRequest.disputeActive = false;
      serviceRequest.activeDisputeStatus = "resolved";
      if (payload.resolutionOutcome === "continue_service") {
        serviceRequest.status = "in_progress";
      } else if (payload.resolutionOutcome === "mark_completed") {
        serviceRequest.status = "completed";
      } else {
        serviceRequest.status = "closed_after_dispute";
      }
      serviceRequest.updatedAt = "2026-04-04T15:00:00.000Z";

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("Service dispute resolved successfully", {
            dispute,
            serviceRequest,
          }),
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

test.describe("Slice 7: Service Request and Engineer Job Flow", () => {
  test("public auth handoff restores the buyer draft and creates the targeted request", async ({
    page,
  }) => {
    const state: Slice7State = {
      serviceRequests: [],
      disputes: [],
    };

    await installSlice7Api(page, {
      state,
      loginUser: buyerUser,
    });

    await page.goto(`/service-engineers/profile?id=${ENGINEER_ID}&view=request`);

    await expect(
      page.getByRole("heading", { name: /Create Service Job Request/i }),
    ).toBeVisible();

    await page.locator('select[name="jobType"]').selectOption("Installation");
    await page.locator('input[name="equipmentName"]').fill("Philips Ultrasound Machine");
    await page.locator('input[name="model"]').fill("EPIQ 7");
    await page.locator('input[name="preferredDate"]').fill("2026-04-10");
    await page.locator('input[name="preferredTime"]').fill("Morning window");
    await page
      .locator('textarea[name="serviceDescription"]')
      .fill("Install and calibrate the unit before the imaging shift starts.");

    await page.getByRole("button", { name: /Submit request/i }).click();
    await expect(page).toHaveURL(/\/register$/);

    const pendingIntent = await readPendingAuthIntent(page);
    expect(pendingIntent).toContain('"action":"request_service"');

    await page.goto("/login");
    await page.getByLabel("Email address").fill("buyer.slice07@example.com");
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    await page.waitForURL(
      new RegExp(`/service-engineers/profile\\?id=${ENGINEER_ID}&view=request`),
    );
    await expect(
      page.getByText(/Your request details were restored/i),
    ).toBeVisible();

    await expect(page.locator('select[name="jobType"]')).toHaveValue("Installation");
    await expect(page.locator('input[name="equipmentName"]')).toHaveValue(
      "Philips Ultrasound Machine",
    );
    await expect(page.locator('input[name="model"]')).toHaveValue("EPIQ 7");
    await expect(page.locator('input[name="preferredDate"]')).toHaveValue(
      "2026-04-10",
    );
    await expect(page.locator('input[name="preferredTime"]')).toHaveValue(
      "Morning window",
    );

    await page.getByRole("button", { name: /Submit request/i }).click();
    await expect(page.getByText(/Request Submitted/i)).toBeVisible();

    await page.getByRole("button", { name: /View service requests/i }).click();
    await page.waitForURL(/\/dashboard\/buyer\/service-request$/);

    await expect(
      page.getByRole("heading", { name: "Service Requests", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Samuel Smart")).toBeVisible();
    await expect(page.locator("table")).toContainText("Pending");

    const body = await page.textContent("body");
    expect(body).not.toMatch(BANNED_INTERNAL_COPY);
  });

  test("engineer accepts the request and moves it to in progress with informational pricing", async ({
    page,
  }) => {
    const state: Slice7State = {
      serviceRequests: [buildServiceRequest()],
      disputes: [],
    };

    await seedSession(page, engineerUser);
    await installSlice7Api(page, {
      state,
      sessionUser: engineerUser,
    });

    await page.goto("/dashboard/engineer/job-requests");

    await expect(
      page.getByRole("heading", { name: "Job Requests", level: 1 }),
    ).toBeVisible();
    await expect(page.getByText("Philips Ultrasound Machine")).toBeVisible();

    await page.getByRole("button", { name: /^Accept$/ }).click();
    await expect(page.locator('input[placeholder="Price (optional)"]')).toBeVisible();

    await page.locator('input[placeholder="Price (optional)"]').fill("250000");
    await page.locator('input[placeholder="Unit price (optional)"]').fill("125000");
    await page.getByRole("button", { name: /Update Job Status/i }).click();

    await expect(page.getByText("Price: NGN 250,000")).toBeVisible();
    await expect(page.getByText("Unit price: NGN 125,000")).toBeVisible();
    await expect(
      page.getByText(/Buyer completion is required from the in-progress state/i),
    ).toBeVisible();

    const body = await page.textContent("body");
    expect(body).not.toMatch(BANNED_INTERNAL_COPY);
  });

  test("buyer can mark an in-progress request as completed and sees the proof fallback", async ({
    page,
  }) => {
    const state: Slice7State = {
      serviceRequests: [
        buildServiceRequest({
          status: "in_progress",
          price: 250000,
          unitPrice: 125000,
        }),
      ],
      disputes: [],
    };

    await seedSession(page, buyerUser);
    await installSlice7Api(page, {
      state,
      sessionUser: buyerUser,
    });

    await page.goto("/dashboard/buyer/service-request");

    await page.getByRole("button", { name: /^View$/ }).click();
    await expect(
      page.getByRole("heading", {
        name: "Request For Service Engineer",
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Mark as completed/i })).toBeVisible();

    await page.getByRole("button", { name: /Mark as completed/i }).click();
    await expect(page.locator("table")).toContainText("Completed");

    await page.getByRole("button", { name: /^View$/ }).click();
    await expect(page.getByText("Proof of completion")).toBeVisible();
    await expect(page.getByText(/No files uploaded yet/i)).toBeVisible();
  });

  test("buyer can raise a service dispute and see the service-specific dispute workflow", async ({
    page,
  }) => {
    const state: Slice7State = {
      serviceRequests: [
        buildServiceRequest({
          status: "in_progress",
          price: 250000,
          unitPrice: 125000,
        }),
      ],
      disputes: [],
    };

    await seedSession(page, buyerUser);
    await installSlice7Api(page, {
      state,
      sessionUser: buyerUser,
    });

    await page.goto("/dashboard/buyer/service-request");
    await page.getByRole("button", { name: /^View$/ }).click();
    await page.getByRole("button", { name: /Raise dispute/i }).click();

    await page.locator("#service-dispute-reason").fill("Installation incomplete");
    await page
      .locator("#service-dispute-description")
      .fill("The engineer left before the calibration checklist was completed.");
    await page.getByRole("button", { name: /Submit dispute/i }).click();

    await expect(
      page.getByText(/This request is currently in the dispute workflow/i),
    ).toBeVisible();
    await expect(page.getByText("Under review").first()).toBeVisible();

    await page.locator("#buyer-dispute-comment").fill("Sharing a follow-up note.");
    await page.getByRole("button", { name: /^Add comment$/ }).click();
    await expect(page.getByText("Sharing a follow-up note.")).toBeVisible();
  });

  test("admin services labels stay exported and dispute resolution uses service outcomes only", async ({
    page,
  }) => {
    const disputedRequest = buildServiceRequest({
      status: "in_progress",
      disputeActive: true,
      activeDisputeId: "slice-07-dispute-1",
      activeDisputeStatus: "under_review",
      price: 250000,
      unitPrice: 125000,
    });
    const dispute = buildServiceDispute(disputedRequest);

    const state: Slice7State = {
      serviceRequests: [disputedRequest],
      disputes: [dispute],
    };

    await seedSession(page, adminUser);
    await installSlice7Api(page, {
      state,
      sessionUser: adminUser,
    });

    await page.goto("/dashboard/admin/services");
    await expect(
      page.getByRole("heading", { name: "Services", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "All Service requests", level: 3 }),
    ).toBeVisible();
    await expect(page.getByText("Distributor's name")).toBeVisible();
    await expect(page.getByText("Product's name")).toBeVisible();
    await expect(page.getByText("Buyer's name")).toBeVisible();

    await page.getByRole("button", { name: /^View$/ }).click();
    await expect(
      page.getByRole("heading", { name: "Service Details", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Distributor's phone number")).toBeVisible();
    await expect(page.getByText("Distributor's email address")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Re-assign service engineer/i }),
    ).toBeDisabled();
    await page.keyboard.press("Escape");

    await page.goto("/dashboard/admin/disputes");
    await expect(
      page.getByRole("heading", { name: "Disputes", exact: true }),
    ).toBeVisible();

    const queueBody = await page.textContent("body");
    expect(queueBody).not.toMatch(BANNED_ORDER_DISPUTE_COPY);

    await page.getByRole("button", { name: /^View$/ }).click();
    await expect(page.getByText("Disputes Management")).toBeVisible();
    await expect(page.getByRole("button", { name: /Continue service/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Mark completed/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Close after dispute/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: /Mark completed/i }).click();
    await expect(page.getByText("Resolved").first()).toBeVisible();
    await expect(page.locator("p", { hasText: "Mark completed" })).toBeVisible();

    const detailBody = await page.textContent("body");
    expect(detailBody).not.toMatch(BANNED_ORDER_DISPUTE_COPY);
    expect(detailBody).not.toMatch(BANNED_INTERNAL_COPY);
  });
});
