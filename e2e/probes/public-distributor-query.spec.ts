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

const publicProfiles = [
  {
    _id: "distributor-acme",
    firstName: "Acme",
    lastName: "Distributor",
    phoneNumber: "+2348012345678",
    address: "Lagos",
    role: "distributor",
  },
  {
    _id: "oem-acme",
    firstName: "Acme",
    lastName: "OEM",
    phoneNumber: "+2348012345679",
    address: "Abuja",
    role: "oem",
  },
];

const latePageProfiles = [
  {
    _id: "distributor-zenith",
    firstName: "Zenith",
    lastName: "Distributor",
    phoneNumber: "+2348012345680",
    address: "Kano",
    role: "distributor",
  },
  {
    _id: "oem-zenith",
    firstName: "Zenith",
    lastName: "OEM",
    phoneNumber: "+2348012345681",
    address: "Ibadan",
    role: "oem",
  },
];

const buildResponse = (url: URL) => {
  const roles = (url.searchParams.get("roles") ?? "distributor,oem")
    .split(",")
    .filter(Boolean);
  const search = url.searchParams.get("search") ?? "";
  const matchingProfiles = publicProfiles.filter(
    (profile) =>
      roles.includes(profile.role) &&
      (!search || profile.firstName.toLowerCase().includes(search.toLowerCase())),
  );

  return ok("Public profiles fetched successfully", {
    docs: matchingProfiles,
    page: Number(url.searchParams.get("page") ?? "1"),
    limit: Number(url.searchParams.get("limit") ?? "10"),
    hasNextPage: true,
    hasPreviousPage: false,
    nextPage: 2,
    previousPage: null,
    totalDocs: 20,
    totalPages: 2,
  });
};

const buildBackendFilteredResponse = (url: URL) => {
  const roles = (url.searchParams.get("roles") ?? "distributor,oem")
    .split(",")
    .filter(Boolean);
  const search = url.searchParams.get("search") ?? "";

  const docs =
    search.toLowerCase() === "zenith"
      ? latePageProfiles.filter((profile) => roles.includes(profile.role))
      : publicProfiles.filter((profile) => roles.includes(profile.role));
  const totalDocs = docs.length;
  const totalPages = totalDocs > 0 ? 1 : 0;

  return ok("Public profiles fetched successfully", {
    docs,
    page: Number(url.searchParams.get("page") ?? "1"),
    limit: Number(url.searchParams.get("limit") ?? "10"),
    hasNextPage: false,
    hasPreviousPage: false,
    nextPage: null,
    previousPage: null,
    totalDocs,
    totalPages,
  });
};

test("public distributor directory uses backend search, role, and pagination queries", async ({
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

  await page.goto("/distributor");

  await expect(
    page.getByRole("heading", { name: /^Distributors & OEMs$/i }),
  ).toBeVisible();
  await expect(page.getByText("Acme Distributor")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Check Profile$/ })).toHaveCount(
    publicProfiles.length,
  );

  expect(profileQueries.at(-1)).toMatchObject({
    page: "1",
    limit: "10",
    roles: "distributor,oem",
  });
  expect(profileQueries.some((query) => "includeFacets" in query)).toBe(false);

  await page.getByRole("button", { name: /^Next$/ }).click();
  await expect.poll(() => profileQueries.at(-1)?.page).toBe("2");

  await page.getByPlaceholder("Search name").fill("Acme");
  await expect.poll(() => profileQueries.at(-1)?.search).toBe("Acme");
  expect(profileQueries.at(-1)).toMatchObject({
    page: "1",
    roles: "distributor,oem",
  });

  await page.locator('[role="combobox"]').click();
  await page.getByRole("option", { name: "Distributor" }).click();
  await expect.poll(() => profileQueries.at(-1)?.roles).toBe("distributor");
  expect(profileQueries.at(-1)).toMatchObject({
    page: "1",
    search: "Acme",
  });

  await page.locator('[role="combobox"]').click();
  await page.getByRole("option", { name: "OEM" }).click();
  await expect.poll(() => profileQueries.at(-1)?.roles).toBe("oem");
  expect(profileQueries.at(-1)).toMatchObject({
    page: "1",
    search: "Acme",
  });

  await page.getByRole("button", { name: /^Clear$/ }).click();
  await expect.poll(() => profileQueries.at(-1)?.roles).toBe("distributor,oem");
  expect(profileQueries.at(-1)?.page).toBe("1");
  expect(profileQueries.at(-1)?.search).toBeUndefined();
  expect(profileQueries.some((query) => "includeFacets" in query)).toBe(false);
});

test("public distributor directory renders backend-filtered matches beyond the initial page", async ({
  page,
}) => {
  const profileQueries: Array<Record<string, string>> = [];

  await page.route(`${API_BASE_URL}/public/profiles**`, async (route) => {
    const url = new URL(route.request().url());
    profileQueries.push(Object.fromEntries(url.searchParams.entries()));

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(buildBackendFilteredResponse(url)),
    });
  });

  await page.goto("/distributor");

  await expect(page.getByText("Acme Distributor")).toBeVisible();
  await expect(page.getByText("Zenith Distributor")).toHaveCount(0);
  await expect(page.getByText("Zenith OEM")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Check Profile$/ })).toHaveCount(
    publicProfiles.length,
  );

  await page.getByPlaceholder("Search name").fill("Zenith");

  await expect.poll(() => profileQueries.at(-1)?.search).toBe("Zenith");
  expect(profileQueries.at(-1)).toMatchObject({
    page: "1",
    limit: "10",
    roles: "distributor,oem",
    search: "Zenith",
  });

  await expect(page.getByText("Acme Distributor")).toHaveCount(0);
  await expect(page.getByText("Zenith Distributor")).toBeVisible();
  await expect(page.getByText("Zenith OEM")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Check Profile$/ })).toHaveCount(
    latePageProfiles.length,
  );

  await page.locator('[role="combobox"]').click();
  await page.getByRole("option", { name: "OEM" }).click();

  await expect.poll(() => profileQueries.at(-1)?.roles).toBe("oem");
  expect(profileQueries.at(-1)).toMatchObject({
    page: "1",
    limit: "10",
    search: "Zenith",
  });
  await expect(page.getByText("Zenith Distributor")).toHaveCount(0);
  await expect(page.getByText("Zenith OEM")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Check Profile$/ })).toHaveCount(
    1,
  );
});

test("public distributor directory clears stale cards and pagination for empty backend results", async ({
  page,
}) => {
  const profileQueries: Array<Record<string, string>> = [];

  await page.route(`${API_BASE_URL}/public/profiles**`, async (route) => {
    const url = new URL(route.request().url());
    profileQueries.push(Object.fromEntries(url.searchParams.entries()));
    const isEmptySearch = url.searchParams.get("search") === "NoMatch";
    const data = isEmptySearch
      ? {
          docs: [],
          page: 1,
          limit: 10,
          hasNextPage: false,
          hasPreviousPage: false,
          nextPage: null,
          previousPage: null,
          totalDocs: 0,
          totalPages: 0,
        }
      : buildResponse(url).data;

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(ok("Public profiles fetched successfully", data)),
    });
  });

  await page.goto("/distributor");

  await expect(page.getByText("Acme Distributor")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Next$/ })).toBeVisible();

  await page.getByPlaceholder("Search name").fill("NoMatch");

  await expect.poll(() => profileQueries.at(-1)?.search).toBe("NoMatch");
  await expect(page.getByText("Acme Distributor")).toHaveCount(0);
  await expect(page.getByText("No users match your search/filter.")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Check Profile$/ })).toHaveCount(
    0,
  );
  await expect(page.getByRole("button", { name: /^Next$/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Previous$/ })).toHaveCount(0);
});
