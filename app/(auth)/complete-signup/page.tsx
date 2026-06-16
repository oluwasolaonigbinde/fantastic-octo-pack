"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button, Input } from "@/components/base";
import { AuthBackButton } from "@/components/features/auth/AuthBackButton";
import authService, { AuthApiError } from "@/services/authService";
import {
  clearPendingRegistrationContext,
  mapAuthStepToPath,
  readPendingRegistrationContext,
  writePendingRegistrationContext,
} from "@/utils/pendingAuth";
import type { PendingRegistrationContext } from "@/types/auth";

type CompleteSignupFormData = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
};

const isInternationalPhoneNumber = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed.startsWith("+")) {
    return false;
  }

  const digitsOnly = trimmed.replace(/\D/g, "");
  return /^\+[1-9]\d{7,14}$/.test(`+${digitsOnly}`);
};

export default function CompleteSignupPage() {
  const router = useRouter();
  const [pendingContext] = useState<PendingRegistrationContext | null>(() =>
    readPendingRegistrationContext(),
  );
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, touchedFields },
  } = useForm<CompleteSignupFormData>({
    mode: "onBlur",
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
    },
  });

  useEffect(() => {
    if (!pendingContext) {
      router.replace("/register");
      return;
    }

    if (pendingContext.nextStep !== "complete_signup") {
      router.replace(mapAuthStepToPath(pendingContext.nextStep));
      return;
    }

    setValue("firstName", pendingContext.firstName || "");
    setValue("lastName", pendingContext.lastName || "");
    setValue("phoneNumber", pendingContext.phoneNumber || "");
  }, [pendingContext, router, setValue]);

  const onSubmit = async (values: CompleteSignupFormData) => {
    if (!pendingContext) {
      router.replace("/register");
      return;
    }

    setIsLoading(true);
    setFormError("");

    try {
      const result = await authService.completeSocialSignup({
        pendingRegistrationId: pendingContext.pendingRegistrationId,
        firstName: pendingContext.firstName ? undefined : values.firstName,
        lastName: pendingContext.lastName ? undefined : values.lastName,
        phoneNumber: values.phoneNumber,
      });

      const nextContext = authService.toPendingRegistrationContext(result.data, {
        firstName: pendingContext.firstName || values.firstName,
        lastName: pendingContext.lastName || values.lastName,
        phoneNumber: values.phoneNumber,
        acceptTerms: pendingContext.acceptTerms,
      });

      if (!nextContext) {
        throw new Error("Unable to continue signup.");
      }

      writePendingRegistrationContext(nextContext);
      router.push("/select-role");
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

      setFormError("Unable to save your signup details right now.");
    } finally {
      setIsLoading(false);
    }
  };

  const needsFirstName = !pendingContext?.firstName;
  const needsLastName = !pendingContext?.lastName;

  return (
    <div className="mx-auto max-w-[414px]">
      <div className="mb-8">
        <Link href="/"><Image src="/logo.png" alt="logo" width={112} height={46} /></Link>
        <AuthBackButton onClick={() => router.back()} />
        <h1 className="type-heading-xxl mt-8 font-medium text-gray1">
          Complete your sign up
        </h1>
        <p className="type-title-md mt-3 text-gray2">
          Add your phone number to continue. We&apos;ll use it to complete your
          account setup.
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
        {needsFirstName ? (
          <Input
            {...register("firstName", {
              required: "First name is required",
              validate: (value) =>
                value.trim().length > 0 || "First name is required",
            })}
            id="firstName"
            label="First name"
            placeholder="Enter your first name"
            error={
              errors.firstName && touchedFields.firstName
                ? errors.firstName.message
                : undefined
            }
          />
        ) : null}

        {needsLastName ? (
          <Input
            {...register("lastName", {
              required: "Last name is required",
              validate: (value) =>
                value.trim().length > 0 || "Last name is required",
            })}
            id="lastName"
            label="Last name"
            placeholder="Enter your last name"
            error={
              errors.lastName && touchedFields.lastName
                ? errors.lastName.message
                : undefined
            }
          />
        ) : null}

        <Input
          {...register("phoneNumber", {
            required: "Phone number is required",
            validate: (value) =>
              isInternationalPhoneNumber(value) ||
              "Phone number must include a country code, for example +2348012345678",
          })}
          id="phoneNumber"
          label="Phone number"
          autoComplete="tel"
          placeholder="Enter your phone number"
          error={
            errors.phoneNumber && touchedFields.phoneNumber
              ? errors.phoneNumber.message
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
  );
}
