import { expect, test } from "@playwright/test";

test("public user can open the marketplace browse screen", async ({ page }) => {
  await page.goto("/products");

  await expect(page).toHaveURL(/\/products(?:\?.*)?$/);
  await expect(page.getByRole("heading", { name: /^All Products$/i })).toBeVisible({
    timeout: 30000,
  });
  await expect(page.getByRole("button", { name: /^Filter$/i }).first()).toBeVisible({
    timeout: 30000,
  });
});
