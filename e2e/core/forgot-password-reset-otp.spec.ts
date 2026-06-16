import { expect, test } from "@playwright/test";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

const PENDING_RESET_STORAGE_KEY = "baiy.auth.pending-reset";

test.describe("Forgot Password Reset OTP", () => {
  test("verify-otp stays empty while reset email context hydrates", async ({
    page,
  }) => {
    await page.addInitScript(
      ({ storageKey }) => {
        window.sessionStorage.setItem(
          storageKey,
          JSON.stringify({
            email: "reset-user@example.com",
            verificationCode: 654321,
          }),
        );
      },
      { storageKey: PENDING_RESET_STORAGE_KEY },
    );

    const verifyOtpPayloads: unknown[] = [];

    await page.route(`${API_BASE_URL}/auth/verify-otp`, async (route) => {
      verifyOtpPayloads.push(route.request().postDataJSON());

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "OTP verified successfully",
          data: {
            resetGrant: "reset-grant-token",
            expiresInMinutes: 15,
          },
        }),
      });
    });

    await page.goto("/verify-otp");

    const otpInput = page.locator('input[data-input-otp="true"]');

    await expect(page).toHaveURL(/\/verify-otp$/);
    await expect(page.getByRole("heading", { name: /verify otp/i })).toBeVisible();
    await expect(otpInput).toHaveValue("");
    await expect(page.getByRole("button", { name: /proceed/i })).toBeDisabled();

    await otpInput.fill("654321");
    await page.getByRole("button", { name: /proceed/i }).click();

    expect(verifyOtpPayloads).toEqual([
      {
        email: "reset-user@example.com",
        verificationCode: 654321,
      },
    ]);
    await expect(page.getByText(/otp verified successfully\./i)).toBeVisible();
  });

  test("verify-otp redirects to forgot-password when reset email context is absent", async ({
    page,
  }) => {
    await page.goto("/verify-otp");

    await expect(page).toHaveURL(/\/forgot-password$/);
  });
});
