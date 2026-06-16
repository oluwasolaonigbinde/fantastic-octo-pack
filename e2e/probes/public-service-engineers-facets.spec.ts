import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

const API_BASE_URL =
  process.env.PLAYWRIGHT_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000/api/v1";

const ok = (message: string, data: unknown) => ({
  success: true,
  message,
  data,
});

const engineer = {
  _id: "engineer-aaron",
  firstName: "Aaron",
  lastName: "Facet",
  phoneNumber: "+2348012345678",
  address: "Lagos",
  role: "engineer",
  rating: 5,
  reviewCount: 2,
  specializations: ["MRI"],
  equipmentTypes: ["CT Scanner"],
  engineerAvailability: "available",
};

const buildResponse = (url: URL) => {
  const search = url.searchParams.get("search") ?? "";
  const hasSearch = search.trim().length > 0;

  return ok("Public profiles fetched successfully", {
    docs: hasSearch && search !== "Aaron" ? [] : [engineer],
    page: Number(url.searchParams.get("page") ?? "1"),
    limit: Number(url.searchParams.get("limit") ?? "9"),
    hasNextPage: false,
    hasPreviousPage: false,
    nextPage: null,
    previousPage: null,
    totalDocs: hasSearch && search !== "Aaron" ? 0 : 5,
    totalPages: 1,
    facets: {
      locations: [
        { value: "Lagos", filteredCount: hasSearch ? 1 : 2 },
        { value: "Abuja", filteredCount: hasSearch ? 0 : 1 },
      ],
      specializations: [
        { value: "MRI", filteredCount: hasSearch ? 1 : 2 },
        { value: "Ultrasound", filteredCount: hasSearch ? 0 : 1 },
      ],
      equipmentTypes: [
        { value: "CT Scanner", filteredCount: hasSearch ? 1 : 2 },
        { value: "Ventilator", filteredCount: hasSearch ? 0 : 1 },
      ],
    },
  });
};

test("public service engineers use backend facets and server query params", async ({
  page,
}) => {
  const profileQueries: Array<Record<string, string>> = [];

  await page.route(`${API_BASE_URL}/public/profiles**`, async (route) => {
    const url = new URL(route.request().url());
    profileQueries.push(Object.fromEntries(url.searchParams.entries()));

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(buildResponse(url)),
    });
  });

  await page.goto("/service-engineers");

  await expect(page.getByText("Ultrasound (1)")).toBeVisible();
  await expect(page.getByText("Ventilator (1)")).toBeVisible();

  await page.getByPlaceholder("Search engineers by name..").fill("Aaron");
  await page.getByRole("button", { name: /^Search$/ }).click();

  await expect(page.getByText("Ultrasound (0)")).toBeVisible();
  await expect(page.getByText("Ventilator (0)")).toBeVisible();
  await expect(
    page.locator("label").filter({ hasText: "Ultrasound (0)" }).locator("input"),
  ).toBeDisabled();

  await page.locator("label").filter({ hasText: "Lagos (1)" }).click();
  await page.locator("label").filter({ hasText: "MRI (1)" }).click();
  await page.locator("label").filter({ hasText: "CT Scanner (1)" }).click();
  await page.locator("label").filter({ hasText: "4+ stars" }).click();
  await page.locator("label").filter({ hasText: "Busy" }).click();
  await page.getByRole("button", { name: /^Filter$/ }).last().click();

  const filteredQuery = profileQueries.at(-1) ?? {};
  expect(filteredQuery.includeFacets).toBe("true");
  expect(filteredQuery.search).toBe("Aaron");
  expect(filteredQuery.location).toBe("Lagos");
  expect(filteredQuery.specialization).toBe("MRI");
  expect(filteredQuery.equipmentType).toBe("CT Scanner");
  expect(filteredQuery.minRating).toBe("4");
  expect(filteredQuery.availability).toBe("busy");

  await page.getByLabel("Sort by").selectOption("name-desc");

  expect(profileQueries.at(-1)?.sortBy).toBe("name-desc");

  const source = readFileSync(
    resolve(process.cwd(), "app/service-engineers/ServiceEngineersPage.client.tsx"),
    "utf8",
  );
  expect(source).not.toContain("setFilterOptions");
  expect(source).not.toContain("react-hooks/set-state-in-effect");
});
