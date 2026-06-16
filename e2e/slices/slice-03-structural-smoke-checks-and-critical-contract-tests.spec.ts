import { expect, test } from "@playwright/test";

const API_BASE_URL =
  process.env.PLAYWRIGHT_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000/api/v1";

const distributorProfile = {
  _id: "slice3-distributor",
  firstName: "Slice",
  lastName: "Distributor",
  phoneNumber: "+2348012345678",
  address: "Distributor Test Lane",
  role: "distributor",
};

const oemProfile = {
  _id: "slice3-oem",
  firstName: "Slice",
  lastName: "OEM",
  phoneNumber: "+2348012345679",
  address: "OEM Test Lane",
  role: "oem",
};

const ok = (message: string, data: unknown) => ({
  success: true,
  message,
  data,
});

test.describe("Slice 3 - Structural Smoke Checks And Critical Contract Tests", () => {
  test("shared auth shells stay available on the supported public path", async ({
    page,
  }) => {
    await page.goto("/register");

    await expect(
      page.getByText("Who are you creating an account as?")
    ).toBeVisible();
    await expect(page.getByText("Distributor", { exact: true })).toBeVisible();
    await expect(page.getByText("OEM", { exact: true })).toBeVisible();
    await expect(page.getByText("Engineer", { exact: true })).toBeVisible();
    await expect(page.getByText("Buyer", { exact: true })).toBeVisible();

    await page.getByLabel("Email").fill("slice3-register@example.com");
    await page.getByLabel("Password").fill("SlicePass123!");
    await page.getByRole("button", { name: /create account/i }).click();

    await expect(
      page.getByText(
        "You must accept the Terms & Condition and Privacy Policy to proceed."
      )
    ).toBeVisible();

    await page.goto("/verify-email?email=slice3-verify@example.com");

    await expect(page.getByText("Verify your email address")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /verify code/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /resend verification email/i })
    ).toBeVisible();

    await page.goto("/verify-email");
    await expect(page).toHaveURL(/\/register$/);

    await page.goto("/login");

    await expect(page.getByText("Welcome back!")).toBeVisible();
    await expect(page.getByRole("button", { name: /^login$/i })).toBeVisible();
    await expect(page.getByText("Remember me")).toBeVisible();
    await expect(
      page.getByRole("link", { name: /^Register$/i })
    ).toBeVisible();
  });

  test("public distributor and OEM profile shells stay wired to the public profile API", async ({
    page,
  }) => {
    const profileRequests: string[] = [];
    const productRequests: string[] = [];

    await page.route(`${API_BASE_URL}/public/profiles**`, async (route) => {
      const url = new URL(route.request().url());
      profileRequests.push(url.toString());

      if (url.pathname.endsWith(`/public/profiles/${distributorProfile._id}`)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(ok("Public profile fetched successfully", distributorProfile)),
        });
        return;
      }

      if (url.pathname.endsWith(`/public/profiles/${oemProfile._id}`)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(ok("Public profile fetched successfully", oemProfile)),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("Public profiles fetched successfully", {
            docs: [distributorProfile, oemProfile],
            totalDocs: 2,
            limit: 10,
            totalPages: 1,
            page: 1,
            hasNextPage: false,
            hasPreviousPage: false,
            nextPage: null,
            previousPage: null,
          }),
        ),
      });
    });

    await page.route(`${API_BASE_URL}/products**`, async (route) => {
      productRequests.push(route.request().url());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("Products fetched successfully", {
            docs: [],
            totalDocs: 0,
            limit: 20,
            totalPages: 1,
            page: 1,
            hasNextPage: false,
            hasPreviousPage: false,
            nextPage: null,
            previousPage: null,
          }),
        ),
      });
    });

    const listResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/v1/public/profiles") &&
        !response.url().includes("/api/v1/public/profiles/") &&
        response.request().method() === "GET"
    );

    await page.goto("/distributor");

    const listResponse = await listResponsePromise;
    expect(listResponse.ok()).toBeTruthy();
    expect(profileRequests.at(-1)).toContain("roles=distributor%2Coem");

    await expect(
      page.getByRole("link", { name: /^Distributor\/OEMs$/i })
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: /^Distributors & OEMs$/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /check profile/i }).first()
    ).toBeVisible();

    const distributorDetailResponsePromise = page.waitForResponse(
      (response) =>
        response
          .url()
          .includes(`/api/v1/public/profiles/${distributorProfile._id}`) &&
        response.request().method() === "GET"
    );
    const distributorProductsResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/v1/products") &&
        response.url().includes(`createdBy=${distributorProfile._id}`) &&
        response.request().method() === "GET"
    );

    await page.goto(`/distributor/profile?id=${distributorProfile._id}`);

    expect((await distributorDetailResponsePromise).ok()).toBeTruthy();
    expect((await distributorProductsResponsePromise).ok()).toBeTruthy();
    expect(productRequests.some((url) => url.includes(`createdBy=${distributorProfile._id}`))).toBe(true);

    await expect(
      page.getByRole("heading", { name: /^Slice Distributor$/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /report for scam/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /send message/i })
    ).toBeVisible();
    await expect(
      page.getByText("No public products are listed for this distributor yet.")
    ).toBeVisible();

    const oemDetailResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/v1/public/profiles/${oemProfile._id}`) &&
        response.request().method() === "GET"
    );
    const oemProductsResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/v1/products") &&
        response.url().includes(`assignedOem=${oemProfile._id}`) &&
        response.request().method() === "GET"
    );

    await page.goto(`/distributor/oem-profile?id=${oemProfile._id}`);

    expect((await oemDetailResponsePromise).ok()).toBeTruthy();
    expect((await oemProductsResponsePromise).ok()).toBeTruthy();
    expect(productRequests.some((url) => url.includes(`assignedOem=${oemProfile._id}`))).toBe(true);

    await expect(
      page.getByRole("heading", { name: /^OEM Profile$/i })
    ).toBeVisible();
    await expect(page.getByText("Slice OEM", { exact: true }).first()).toBeVisible();
    await expect(
      page.getByText("No products found for this OEM.")
    ).toBeVisible();
  });
});
