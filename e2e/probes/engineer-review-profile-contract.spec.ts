import { expect, test, type Page } from "@playwright/test";

const API_BASE_URL =
  process.env.PLAYWRIGHT_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000/api/v1";

const SEEDED_ENGINEER_ID = "engineer-seeded-001";
const REVIEWED_ENGINEER_ID = "engineer-reviewed-002";

const ok = (message: string, data: unknown) => ({
  success: true,
  message,
  data,
});

async function stubEngineerProfileApis(page: Page) {
  await page.route(`${API_BASE_URL}/**`, async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (method !== "GET") {
      await route.continue();
      return;
    }

    if (url === `${API_BASE_URL}/public/profiles/${SEEDED_ENGINEER_ID}`) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("Public profile fetched successfully", {
            _id: SEEDED_ENGINEER_ID,
            firstName: "Sade",
            lastName: "Okafor",
            role: "engineer",
            rating: 4.7,
            bio: "Field engineer trusted for preventive maintenance and diagnostics.",
            specializations: ["MRI", "Diagnostics"],
            equipmentTypes: ["CT Scanner"],
            oemTags: ["GE Healthcare"],
            engineerAvailability: "available",
          })
        ),
      });
      return;
    }

    if (url === `${API_BASE_URL}/reviews/engineer/${SEEDED_ENGINEER_ID}`) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(ok("Reviews fetched successfully", [])),
      });
      return;
    }

    if (url === `${API_BASE_URL}/public/profiles/${REVIEWED_ENGINEER_ID}`) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("Public profile fetched successfully", {
            _id: REVIEWED_ENGINEER_ID,
            firstName: "Emeka",
            lastName: "Bassey",
            role: "engineer",
            rating: 4.3,
            reviewCount: 2,
            bio: "Specialist in imaging equipment calibration and commissioning.",
            specializations: ["Calibration", "Maintenance"],
            equipmentTypes: ["Ultrasound"],
            oemTags: ["Philips"],
            engineerAvailability: "busy",
          })
        ),
      });
      return;
    }

    if (url === `${API_BASE_URL}/reviews/engineer/${REVIEWED_ENGINEER_ID}`) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          ok("Reviews fetched successfully", [
            {
              _id: "review-1",
              engineer: REVIEWED_ENGINEER_ID,
              rating: 5,
              comment: "Excellent install support and quick follow-up.",
              createdAt: "2026-03-11T08:00:00.000Z",
              buyer: {
                _id: "buyer-1",
                firstName: "Amina",
                lastName: "Bello",
              },
              serviceRequest: {
                _id: "service-request-1",
                jobType: "Installation",
                equipmentName: "Philips Ultrasound",
              },
            },
            {
              _id: "review-2",
              engineer: REVIEWED_ENGINEER_ID,
              rating: 4,
              comment: "Strong diagnostics work and clear communication.",
              createdAt: "2026-03-02T10:30:00.000Z",
              buyer: {
                _id: "buyer-2",
                firstName: "Tunde",
                lastName: "Afolabi",
              },
              serviceRequest: {
                _id: "service-request-2",
                jobType: "Maintenance",
                equipmentName: "Portable Ultrasound",
              },
            },
          ])
        ),
      });
      return;
    }

    await route.continue();
  });
}

test.describe("Engineer review profile contract", () => {
  test.beforeEach(async ({ page }) => {
    await stubEngineerProfileApis(page);
  });

  test("seeded engineer rating stays visible when there are no buyer reviews", async ({
    page,
  }) => {
    await page.goto(`/service-engineers/profile?id=${SEEDED_ENGINEER_ID}&view=profile`);

    await expect(page.getByRole("heading", { name: "Sade Okafor" })).toBeVisible();
    await expect(
      page.getByText("Public profile summary: 4.7 marketplace rating.")
    ).toBeVisible();
    await expect(page.getByText("No buyer reviews yet")).toBeVisible();
    await expect(page.getByText(/^0\.0$/)).toHaveCount(0);
  });

  test("real buyer reviews render without replacing the public profile summary", async ({
    page,
  }) => {
    await page.goto(`/service-engineers/profile?id=${REVIEWED_ENGINEER_ID}&view=profile`);

    await expect(page.getByRole("heading", { name: "Emeka Bassey" })).toBeVisible();
    await expect(
      page.getByText("Public profile summary: 4.3 from 2 buyer reviews.")
    ).toBeVisible();
    await expect(page.getByText("Excellent install support and quick follow-up.")).toBeVisible();
    await expect(page.getByText("Philips Ultrasound")).toBeVisible();
    await expect(page.getByText("Strong diagnostics work and clear communication.")).toBeVisible();
  });
});
