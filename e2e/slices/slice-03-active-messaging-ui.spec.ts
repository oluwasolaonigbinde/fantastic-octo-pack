import { expect, test, type Page } from "@playwright/test";

const API_BASE_URL =
  process.env.PLAYWRIGHT_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000/api/v1";

const AUTH_SESSION_STORAGE_KEY = "baiy.auth.session";

type Role = "buyer" | "distributor" | "engineer" | "oem" | "admin" | "agent";

const roleRoute: Record<"buyer" | "distributor" | "engineer", string> = {
  buyer: "/dashboard/buyer/messages",
  distributor: "/dashboard/distributor/message",
  engineer: "/dashboard/engineer/messaging",
};

const roleId: Record<Role, string> = {
  buyer: "507f1f77bcf86cd799439011",
  distributor: "507f1f77bcf86cd799439022",
  engineer: "507f1f77bcf86cd799439033",
  oem: "507f1f77bcf86cd799439044",
  admin: "507f1f77bcf86cd799439055",
  agent: "507f1f77bcf86cd799439066",
};

const roleName: Record<Role, { firstName: string; lastName: string }> = {
  buyer: { firstName: "Bola", lastName: "Buyer" },
  distributor: { firstName: "Dara", lastName: "Distributor" },
  engineer: { firstName: "Emeka", lastName: "Engineer" },
  oem: { firstName: "Ola", lastName: "OEM" },
  admin: { firstName: "Ada", lastName: "Admin" },
  agent: { firstName: "Ayo", lastName: "Agent" },
};

const ok = (message: string, data: unknown) => ({
  success: true,
  message,
  data,
});

const buildSessionUser = (role: Role) => ({
  _id: roleId[role],
  firstName: roleName[role].firstName,
  lastName: roleName[role].lastName,
  email: `${role}.slice03.messaging@example.com`,
  phoneNumber: "+2348012345678",
  role,
  status: "active",
  isEmailVerified: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  tokens: {
    accessToken: `slice-03-${role}-access-token`,
    refreshToken: `slice-03-${role}-refresh-token`,
  },
});

const buildCounterpart = (role: Role) => ({
  id: roleId[role],
  role,
  displayName: `${roleName[role].firstName} ${roleName[role].lastName}`,
  avatarUrl: null,
  secondaryLabel: role === "distributor" ? "Verified Seller" : null,
  isVerifiedSeller: role === "distributor",
});

const buildConversation = (
  senderRole: "buyer" | "distributor" | "engineer",
  receiverRole: "buyer" | "distributor" | "engineer",
) => ({
  id: `conversation-${senderRole}-${receiverRole}`,
  participants: [roleId[senderRole], roleId[receiverRole]],
  createdAt: "2026-04-20T08:00:00.000Z",
  lastMessageAt: null,
  lastMessagePreview: null,
  counterpart: buildCounterpart(receiverRole),
});

async function seedSession(page: Page, role: Role) {
  const user = buildSessionUser(role);
  await page.addInitScript(
    ([key, val]) => window.localStorage.setItem(key, val),
    [AUTH_SESSION_STORAGE_KEY, JSON.stringify(user)],
  );
  return user;
}

async function installAuthProfileMock(page: Page, role: Role) {
  const user = buildSessionUser(role);

  await page.route(`${API_BASE_URL}/auth/profile`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(ok("Profile fetched successfully", { ...user, tokens: undefined })),
    });
  });
}

async function installMessagingMocks(
  page: Page,
  senderRole: "buyer" | "distributor" | "engineer",
  receiverRole: "buyer" | "distributor" | "engineer",
) {
  const senderId = roleId[senderRole];
  const conversation = buildConversation(senderRole, receiverRole);
  const messages: Array<{
    id: string;
    conversationId: string;
    senderId: string;
    text: string;
    createdAt: string;
  }> = [];

  const calls = {
    startBodies: [] as unknown[],
    sendBodies: [] as unknown[],
  };

  await page.route(`${API_BASE_URL}/conversations**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (request.method() === "GET" && url.pathname.endsWith("/conversations")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Conversations retrieved", messages.length ? [conversation] : [])),
      });
      return;
    }

    if (request.method() === "POST" && url.pathname.endsWith("/conversations/start")) {
      calls.startBodies.push(request.postDataJSON());
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(ok("Conversation created", conversation)),
      });
      return;
    }

    if (request.method() === "GET" && url.pathname.endsWith(`/conversations/${conversation.id}`)) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("Conversation retrieved", {
            conversation: {
              ...conversation,
              lastMessageAt: messages.at(-1)?.createdAt ?? conversation.lastMessageAt,
              lastMessagePreview: messages.at(-1)?.text ?? null,
            },
            messages,
          }),
        ),
      });
      return;
    }

    await route.continue();
  });

  await page.route(`${API_BASE_URL}/messages/send`, async (route) => {
    const body = route.request().postDataJSON() as {
      conversationId: string;
      text: string;
    };
    calls.sendBodies.push(body);
    const message = {
      id: `message-${messages.length + 1}`,
      conversationId: body.conversationId,
      senderId,
      text: body.text.trim(),
      createdAt: "2026-04-20T08:01:00.000Z",
    };
    messages.push(message);

    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify(ok("Message sent", message)),
    });
  });

  return calls;
}

const allowedComposeCases = [
  ["buyer", "distributor"],
  ["buyer", "engineer"],
  ["distributor", "buyer"],
  ["distributor", "engineer"],
  ["engineer", "buyer"],
  ["engineer", "distributor"],
] as const;

const rejectedComposeCases = [
  {
    label: "self",
    receiverId: roleId.buyer,
    status: 400,
    message: "Cannot start a conversation with yourself",
  },
  {
    label: "same-role",
    receiverId: "507f1f77bcf86cd799439099",
    status: 403,
    message: "This role pair cannot exchange messages",
  },
  {
    label: "OEM",
    receiverId: roleId.oem,
    status: 403,
    message: "Messaging is not available for this role",
  },
  {
    label: "Admin",
    receiverId: roleId.admin,
    status: 403,
    message: "Messaging is not available for this role",
  },
  {
    label: "Agent",
    receiverId: roleId.agent,
    status: 403,
    message: "Messaging is not available for this role",
  },
] as const;

const invalidBlankComposeCases = [
  { label: "missing to", query: "compose=1" },
  { label: "empty to", query: "compose=1&to=" },
  { label: "whitespace-only to", query: `compose=1&to=${encodeURIComponent("   ")}` },
] as const;

test.describe("Slice 3 active messaging UI", () => {
  for (const [senderRole, receiverRole] of allowedComposeCases) {
    test(`${senderRole} can compose and send to ${receiverRole}`, async ({ page }) => {
      await seedSession(page, senderRole);
      await installAuthProfileMock(page, senderRole);
      const calls = await installMessagingMocks(page, senderRole, receiverRole);

      await page.goto(`${roleRoute[senderRole]}?compose=1&to=${roleId[receiverRole]}`);

      await expect(page.getByTestId("active-messaging-panel")).toBeVisible();
      await expect(page.getByTestId("conversation-list-item")).toHaveCount(1);
      await expect(page.getByTestId("message-input")).toBeFocused();
      await expect(page).toHaveURL(
        `${roleRoute[senderRole]}?compose=1&to=${roleId[receiverRole]}`,
      );
      await expect(
        page
          .getByTestId("conversation-list-item")
          .filter({ hasText: buildCounterpart(receiverRole).displayName }),
      ).toHaveCount(1);
      await expect(
        page
          .getByTestId("thread-view")
          .getByText(buildCounterpart(receiverRole).displayName, { exact: true }),
      ).toBeVisible();

      await page.getByTestId("message-input").fill(`Hello ${receiverRole}`);
      await page.getByTestId("send-message-button").click();

      await expect(page.getByText(`Hello ${receiverRole}`)).toBeVisible();
      expect(calls.startBodies).toEqual([{ receiverId: roleId[receiverRole] }]);
      expect(calls.sendBodies).toEqual([
        {
          conversationId: `conversation-${senderRole}-${receiverRole}`,
          text: `Hello ${receiverRole}`,
        },
      ]);
    });
  }

  for (const rejected of rejectedComposeCases) {
    test(`${rejected.label} compose rejection clears invalid receiver state`, async ({ page }) => {
      await seedSession(page, "buyer");
      await installAuthProfileMock(page, "buyer");
      const startBodies: unknown[] = [];

      await page.route(`${API_BASE_URL}/conversations**`, async (route) => {
        const request = route.request();
        const url = new URL(request.url());

        if (request.method() === "GET" && url.pathname.endsWith("/conversations")) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(ok("Conversations retrieved", [])),
          });
          return;
        }

        if (request.method() === "POST" && url.pathname.endsWith("/conversations/start")) {
          startBodies.push(request.postDataJSON());
          await route.fulfill({
            status: rejected.status,
            contentType: "application/json",
            body: JSON.stringify({
              success: false,
              message: rejected.message,
              data: null,
            }),
          });
          return;
        }

        await route.continue();
      });

      await page.goto(`${roleRoute.buyer}?compose=1&to=${rejected.receiverId}`);

      await expect(page).toHaveURL(roleRoute.buyer);
      await expect(page.getByText(rejected.message)).toBeVisible();
      await expect(page.getByText(/^Contact /)).toHaveCount(0);
      expect(startBodies).toEqual([{ receiverId: rejected.receiverId }]);
    });
  }

  for (const invalid of invalidBlankComposeCases) {
    test(`${invalid.label} compose cleanup makes no messaging mutation calls`, async ({
      page,
    }) => {
      await seedSession(page, "buyer");
      const mutationCalls: string[] = [];

      await page.route(`${API_BASE_URL}/**`, async (route) => {
        const request = route.request();
        const url = new URL(request.url());

        if (url.pathname.endsWith("/auth/profile") && request.method() === "GET") {
          const user = buildSessionUser("buyer");
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(ok("Profile fetched successfully", { ...user, tokens: undefined })),
          });
          return;
        }

        if (request.method() === "GET" && url.pathname.endsWith("/conversations")) {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(ok("Conversations retrieved", [])),
          });
          return;
        }

        if (
          request.method() === "POST" &&
          (url.pathname.endsWith("/conversations/start") ||
            url.pathname.endsWith("/messages/send"))
        ) {
          mutationCalls.push(url.pathname);
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({
              success: false,
              message: "Unexpected messaging mutation",
              data: null,
            }),
          });
          return;
        }

        await route.continue();
      });

      await page.goto(`${roleRoute.buyer}?${invalid.query}`);

      await expect(page).toHaveURL(roleRoute.buyer);
      expect(mutationCalls).toEqual([]);
    });
  }

  test("active routes do not expose Phase 1 out-of-scope controls", async ({ page }) => {
    await seedSession(page, "buyer");
    await installAuthProfileMock(page, "buyer");
    await installMessagingMocks(page, "buyer", "distributor");

    await page.goto(`${roleRoute.buyer}?compose=1&to=${roleId.distributor}`);

    await expect(page.getByLabel("Message text")).toBeVisible();
    await expect(page.getByLabel("Send message")).toBeVisible();
    await expect(page.getByText(/start order/i)).toHaveCount(0);
    await expect(page.getByText(/attach|attachment|voice|image upload|read receipt/i)).toHaveCount(0);
  });

  test("OEM and admin messaging routes make no messaging mutation calls", async ({ page }) => {
    const mutationCalls: string[] = [];
    let profileRole: Role = "oem";

    await page.route(`${API_BASE_URL}/**`, async (route) => {
      const request = route.request();
      const url = new URL(request.url());

      if (url.pathname.endsWith("/auth/profile") && request.method() === "GET") {
        const user = buildSessionUser(profileRole);
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(ok("Profile fetched successfully", { ...user, tokens: undefined })),
        });
        return;
      }

      if (
        request.method() === "POST" &&
        (url.pathname.endsWith("/conversations/start") ||
          url.pathname.endsWith("/messages/send"))
      ) {
        mutationCalls.push(url.pathname);
      }

      await route.continue();
    });

    await seedSession(page, "oem");
    await page.goto("/dashboard/oem/messaging");
    await expect(page.getByText(/OEM messaging is not available/i)).toBeVisible();
    await expect(page.getByLabel("Message text disabled")).toBeDisabled();

    profileRole = "admin";
    await page.evaluate(
      ([key, val]) => window.localStorage.setItem(key, val),
      [AUTH_SESSION_STORAGE_KEY, JSON.stringify(buildSessionUser("admin"))],
    );
    await page.goto("/dashboard/admin/messaging");
    await expect(page.getByText(/Admin messaging is not available/i)).toBeVisible();
    await expect(page.getByPlaceholder("Messaging unavailable")).toBeDisabled();

    profileRole = "agent";
    await page.evaluate(
      ([key, val]) => window.localStorage.setItem(key, val),
      [AUTH_SESSION_STORAGE_KEY, JSON.stringify(buildSessionUser("agent"))],
    );
    await page.goto("/dashboard/agent/messaging");
    await page.waitForLoadState("networkidle");

    expect(mutationCalls).toEqual([]);
  });
});
