"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, PopUp } from "@/components/base";
import { AuthBackButton } from "@/components/features/auth/AuthBackButton";
import authService, { AuthApiError } from "@/services/authService";
import {
  clearPendingRegistrationContext,
  mapAuthStepToPath,
  readPendingRegistrationContext,
} from "@/utils/pendingAuth";
import type { PendingRegistrationContext } from "@/types/auth";
import {
  passwordSetupSchema,
  type PasswordSetupFormData,
} from "./create-password.schema";

export default function CreatePasswordPage() {
  const router = useRouter();
  const [pendingContext] = useState<PendingRegistrationContext | null>(() =>
    readPendingRegistrationContext(),
  );
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
  } = useForm<PasswordSetupFormData>({
    resolver: zodResolver(passwordSetupSchema),
    mode: "onBlur",
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!pendingContext) {
      router.replace("/register");
      return;
    }

    if (pendingContext.nextStep !== "create_password") {
      router.replace(mapAuthStepToPath(pendingContext.nextStep));
      return;
    }
  }, [pendingContext, router]);

  const onSubmit = async (values: PasswordSetupFormData) => {
    if (!pendingContext) {
      router.replace("/register");
      return;
    }

    setIsLoading(true);
    setFormError("");

    try {
      const result = await authService.createAccount({
        pendingRegistrationId: pendingContext.pendingRegistrationId,
        password: values.newPassword,
        role: pendingContext.role,
      });

      if (result.data.nextStep !== "login") {
        throw new Error("Unexpected account creation response.");
      }

      clearPendingRegistrationContext();
      setShowSuccessPopup(true);
    } catch (error) {
      if (error instanceof AuthApiError) {
        if (error.statusCode === 410) {
          clearPendingRegistrationContext();
          router.replace("/register");
          return;
        }

        setFormError(error.message);
        return;
      }

      setFormError("Unable to create your account right now.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="mx-auto max-w-[414px]">
        <div className="mb-8">
          <Link href="/"><Image src="/logo.png" alt="logo" width={112} height={46} /></Link>
          <AuthBackButton onClick={() => router.back()} />
          <h1 className="type-heading-xxl mt-8 font-medium text-gray1">
            Create Password
          </h1>
          <p className="type-title-md mt-3 text-gray2">
            Please go ahead to create your password. Ensure you always keep your
            password safe.
          </p>
        </div>

        {formError ? (
          <div className="mb-4 rounded-xl border border-danger/30 bg-danger/5 p-4">
            <p className="text-sm text-danger">{formError}</p>
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-6"
        >
          <Input
            {...register("newPassword")}
            id="newPassword"
            type="password"
            label="Create password"
            autoComplete="new-password"
            placeholder="Enter new password"
            error={
              errors.newPassword && touchedFields.newPassword
                ? errors.newPassword.message
                : undefined
            }
          />

          <Input
            {...register("confirmPassword")}
            id="confirmPassword"
            type="password"
            label="Confirm new password"
            autoComplete="new-password"
            placeholder="Enter new password again"
            error={
              errors.confirmPassword && touchedFields.confirmPassword
                ? errors.confirmPassword.message
                : undefined
            }
          />

          <Button
            type="submit"
            title="Proceed"
            isBusy={isLoading}
            disabled={isLoading}
          />
        </form>

      </div>

      <PopUp
        open={showSuccessPopup}
        title="Congratulations"
        description="Your account have been created successfully. You can now log in to your account."
        primaryButtonText="Proceed"
        onClose={() => setShowSuccessPopup(false)}
        onPrimaryAction={() => router.push("/login")}
      />
    </>
  );
}
