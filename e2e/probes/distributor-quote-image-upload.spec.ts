import { expect, test } from "@playwright/test";

const SESSION_KEY = "baiy.auth.session";
const distributor = {
  _id: "quote-image-distributor",
  firstName: "Staging",
  lastName: "Distonee",
  email: "staging.dist1@client.test",
  role: "distributor",
  status: "active",
  isEmailVerified: true,
  tokens: { accessToken: "quote-image-token", refreshToken: "quote-image-refresh" },
};
const quote = {
  _id: "quote-image-pending",
  status: "pending_response",
  createdAt: "2026-07-22T08:00:00.000Z",
  rfq: {
    _id: "64B289BE",
    buyer: { _id: "buyer-1", firstName: "Amina", lastName: "Bello" },
    items: [{ productName: "Digital Blood Pressure Monitor", quantity: 1, model: "DBPM-1" }],
    createdAt: "2026-07-22T08:00:00.000Z",
    isBulk: false,
  },
};

const ok = (message: string, data: unknown) => ({ success: true, message, data });

test("selecting quote images preserves the response form and shows previews", async ({ page }) => {
  await page.context().addCookies([{
    name: "baiy_role",
    value: "distributor",
    url: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100",
  }]);
  await page.addInitScript(
    ([key, value]) => localStorage.setItem(key, value),
    [SESSION_KEY, JSON.stringify(distributor)],
  );
  await page.route("**/api/v1/**", async (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname.endsWith("/auth/profile")) {
      await route.fulfill({ json: ok("Profile fetched", { ...distributor, tokens: undefined }) });
    } else if (pathname.endsWith("/rfqs/inbox/quotes")) {
      await route.fulfill({ json: ok("Inbox fetched", [quote]) });
    } else if (pathname.endsWith("/products")) {
      await route.fulfill({ json: ok("Products fetched", { products: [] }) });
    } else {
      await route.fulfill({ json: ok("Empty response", []) });
    }
  });

  await page.goto("/dashboard/distributor/quotes");
  await page.getByRole("button", { name: "View" }).click();
  await page.getByRole("button", { name: "Respond to Quote" }).click();

  await page.locator("#quote-images").setInputFiles([
    { name: "test-quote.jpg", mimeType: "image/jpeg", buffer: Buffer.from("jpeg") },
    { name: "test-quote-2.png", mimeType: "image/png", buffer: Buffer.from("png") },
  ]);

  const selectedImages = page.getByLabel("Selected quote images");
  await expect(selectedImages).toBeVisible();
  await expect(selectedImages.getByRole("img")).toHaveCount(2);
  await expect(selectedImages).toContainText("test-quote.jpg");
  await expect(page.getByRole("button", { name: "Send Quote" })).toBeVisible();
});
