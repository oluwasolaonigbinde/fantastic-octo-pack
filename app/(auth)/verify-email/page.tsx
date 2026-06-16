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
  clearPendingRegistrationContext,
  mapAuthStepToPath,
  readPendingRegistrationContext,
  writePendingRegistrationContext,
} from "@/utils/pendingAuth";
import type { PendingRegistrationContext } from "@/types/auth";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [pendingContext, setPendingContext] =
    useState<PendingRegistrationContext | null>(() =>
      readPendingRegistrationContext(),
    );
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  useEffect(() => {
    if (!pendingContext) {
      router.replace("/register");
      return;
    }

    if (pendingContext.source !== "manual") {
      router.replace(mapAuthStepToPath(pendingContext.nextStep));
      return;
    }

    if (pendingContext.nextStep !== "verify_email") {
      router.replace(mapAuthStepToPath(pendingContext.nextStep));
    }
  }, [pendingContext, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!pendingContext) {
      router.replace("/register");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setInfoMessage("");

    try {
      const result = await authService.verifyRegistrationEmail({
        pendingRegistrationId: pendingContext.pendingRegistrationId,
        verificationCode: Number(otp),
      });

      const nextContext = authService.toPendingRegistrationContext(result.data, {
        firstName: pendingContext.firstName,
        lastName: pendingContext.lastName,
        phoneNumber: pendingContext.phoneNumber,
        acceptTerms: pendingContext.acceptTerms,
      });

      if (!nextContext) {
        throw new Error("Unable to continue signup.");
      }

      writePendingRegistrationContext(nextContext);
      setPendingContext(nextContext);
      setShowSuccessPopup(true);
    } catch (error) {
      if (error instanceof AuthApiError) {
        if (error.statusCode === 410) {
          clearPendingRegistrationContext();
          router.replace("/register");
          return;
        }

        setErrorMessage(error.message);
        return;
      }

      setErrorMessage("Unable to verify your email right now.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!pendingContext) {
      return;
    }

    setIsResending(true);
    setErrorMessage("");
    setInfoMessage("");

    try {
      const result = await authService.resendRegistrationOtp(
        pendingContext.pendingRegistrationId,
      );

      writePendingRegistrationContext({
        ...pendingContext,
        verificationCode: result.data?.verificationCode,
      });
      setPendingContext((current) =>
        current
          ? {
              ...current,
              verificationCode: result.data?.verificationCode,
            }
          : current,
      );
      setOtp("");
      setInfoMessage(
        `A fresh verification code was sent to ${pendingContext.email}.`,
      );
    } catch (error) {
      if (error instanceof AuthApiError) {
        if (error.statusCode === 410) {
          clearPendingRegistrationContext();
          router.replace("/register");
          return;
        }

        setErrorMessage(error.message);
        return;
      }

      setErrorMessage("Unable to resend the verification code right now.");
    } finally {
      setIsResending(false);
    }
  };

  const inputClassName =
    "h-14 w-14 rounded-xl border border-gray5 text-center text-xl text-gray1 focus:border-primary focus:outline-none focus:ring-0";

  return (
    <>
      <div className="mx-auto max-w-[414px]">
        <div className="mb-8 text-gray1">
          <Link href="/"><Image src="/logo.png" alt="logo" width={112} height={46} /></Link>
          <AuthBackButton onClick={() => router.back()} />
          <h1 className="type-heading-xxl mt-8 font-medium">
            Verify your email address
          </h1>
          <p className="type-title-md mt-3 text-gray2">
            Enter below the OTP we sent to your email to help us verify your
            account.
          </p>
        </div>

        {errorMessage ? (
          <div className="mb-4 rounded-xl border border-danger/30 bg-danger/5 p-4">
            <p className="text-sm text-danger">{errorMessage}</p>
          </div>
        ) : null}

        {infoMessage ? (
          <div className="mb-4 rounded-xl border border-success/30 bg-green-50 p-4">
            <p className="text-sm text-success">{infoMessage}</p>
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
            title="Verify Account"
            isBusy={isLoading}
            disabled={isLoading || otp.length !== 6}
          />
        </form>

        <button
          type="button"
          onClick={handleResend}
          disabled={isResending}
          className="mt-4 text-sm font-medium text-primary hover:underline disabled:opacity-60"
        >
          {isResending ? "Resending..." : "Resend verification email"}
        </button>

      </div>

      <PopUp
        open={showSuccessPopup}
        title="Congratulations"
        description="Verification successful"
        primaryButtonText="Proceed"
        onClose={() => setShowSuccessPopup(false)}
        onPrimaryAction={() => router.push("/select-role")}
      />
    </>
  );
}
