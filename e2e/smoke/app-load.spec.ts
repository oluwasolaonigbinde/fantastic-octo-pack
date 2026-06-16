import { expect, test } from "@playwright/test";

test("homepage loads the public app shell", async ({ page }) => {
  await page.goto("/");

  await expect(
    page
      .getByTestId("public-home-hero")
      .getByRole("heading", { level: 1 }),
  ).toBeVisible();
});
