"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useRouter } from "next/navigation";
import { Button, PopUp } from "@/components/base";
import { AuthBackButton } from "@/components/features/auth/AuthBackButton";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import authService, { AuthApiError } from "@/services/authService";
import {
  clearPendingResetContext,
  readPendingResetContext,
  writePendingResetContext,
} from "@/utils/pendingAuth";

export default function VerifyOtpPage() {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [email] = useState(() => readPendingResetContext()?.email || "");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  useEffect(() => {
    if (!email) {
      router.replace("/forgot-password");
    }
  }, [email, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email) {
      router.replace("/forgot-password");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await authService.verifyOtp({
        email,
        verificationCode: Number(otp),
      });

      writePendingResetContext({
        email,
        resetGrant: result.data.resetGrant,
      });
      setShowSuccessPopup(true);
    } catch (error) {
      if (error instanceof AuthApiError) {
        setErrorMessage(error.message);
        return;
      }

      setErrorMessage("Unable to verify the OTP right now.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClassName =
    "h-14 w-14 rounded-xl border border-gray5 text-center text-xl text-gray1 focus:border-primary focus:outline-none focus:ring-0";

  return (
    <>
      <div className="mx-auto max-w-[414px]">
        <div className="mb-8 text-gray1">
          <Link href="/"><Image src="/logo.png" alt="logo" width={112} height={46} /></Link>
          <AuthBackButton
            label="Back"
            onClick={() => {
              clearPendingResetContext();
              router.back();
            }}
          />
          <h1 className="type-heading-xxl mt-8 font-medium">
            Verify OTP
          </h1>
          <p className="type-title-md mt-3 text-gray2">
            We&apos;ve sent an OTP code to your email address, kindly enter it
            below and proceed.
          </p>
        </div>

        {errorMessage ? (
          <div className="mb-4 rounded-xl border border-danger/30 bg-danger/5 p-4">
            <p className="text-sm text-danger">{errorMessage}</p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <InputOTP
            value={otp}
            onChange={setOtp}
            maxLength={6}
            pattern={REGEXP_ONLY_DIGITS}
          >
            <InputOTPGroup className="mb-8 flex w-full justify-between gap-3">
              <InputOTPSlot index={0} className={inputClassName} />
              <InputOTPSlot index={1} className={inputClassName} />
              <InputOTPSlot index={2} className={inputClassName} />
              <InputOTPSlot index={3} className={inputClassName} />
              <InputOTPSlot index={4} className={inputClassName} />
              <InputOTPSlot index={5} className={inputClassName} />
            </InputOTPGroup>
          </InputOTP>

          <Button
            type="submit"
            title="Proceed"
            isBusy={isLoading}
            disabled={isLoading || otp.length !== 6}
          />
        </form>

      </div>

      <PopUp
        open={showSuccessPopup}
        title="Congratulations"
        description="OTP Verified successfully."
        primaryButtonText="Proceed"
        onClose={() => setShowSuccessPopup(false)}
        onPrimaryAction={() => router.push("/reset-password")}
      />
    </>
  );
}
