"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button, Input, PopUp } from "@/components/base";
import { useAcceptInviteMutation } from "@/hooks/queries/team";
import {
  acceptInviteSchema,
  type AcceptInviteFormData,
} from "./accept-invite.schema";

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [formError, setFormError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const { mutateAsync, isPending } = useAcceptInviteMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
  } = useForm<AcceptInviteFormData>({
    resolver: zodResolver(acceptInviteSchema),
    mode: "onBlur",
    defaultValues: {
      firstName: "",
      lastName: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: AcceptInviteFormData) => {
    setFormError("");

    if (!token) {
      setFormError("This invitation link is invalid or has expired.");
      return;
    }

    try {
      await mutateAsync({
        token,
        password: values.password,
        firstName: values.firstName || undefined,
        lastName: values.lastName || undefined,
      });
      setShowSuccess(true);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to accept this invitation right now.",
      );
    }
  };

  return (
    <>
      <div className="mx-auto max-w-[414px]">
        <div className="mb-8">
          <Link href="/">
            <Image src="/logo.png" alt="logo" width={112} height={46} />
          </Link>
          <h1 className="type-heading-xxl mt-8 font-medium text-gray1">
            Join the team
          </h1>
          <p className="type-title-md mt-3 text-gray2">
            Set a password to accept your invitation and activate your account.
          </p>
        </div>

        {!token ? (
          <div className="mb-4 rounded-xl border border-danger/30 bg-danger/5 p-4">
            <p className="text-sm text-danger">
              This invitation link is missing its token. Please use the link
              from your invitation email.
            </p>
          </div>
        ) : null}

        {formError ? (
          <div className="mb-4 rounded-xl border border-danger/30 bg-danger/5 p-4">
            <p className="text-sm text-danger">{formError}</p>
          </div>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register("firstName")}
              id="firstName"
              label="First name"
              placeholder="Ada"
              error={
                errors.firstName && touchedFields.firstName
                  ? errors.firstName.message
                  : undefined
              }
            />
            <Input
              {...register("lastName")}
              id="lastName"
              label="Last name"
              placeholder="Obi"
              error={
                errors.lastName && touchedFields.lastName
                  ? errors.lastName.message
                  : undefined
              }
            />
          </div>

          <Input
            {...register("password")}
            id="password"
            type="password"
            label="Create password"
            autoComplete="new-password"
            placeholder="Enter a password"
            error={
              errors.password && touchedFields.password
                ? errors.password.message
                : undefined
            }
          />

          <Input
            {...register("confirmPassword")}
            id="confirmPassword"
            type="password"
            label="Confirm password"
            autoComplete="new-password"
            placeholder="Enter the password again"
            error={
              errors.confirmPassword && touchedFields.confirmPassword
                ? errors.confirmPassword.message
                : undefined
            }
          />

          <Button
            type="submit"
            title="Accept invitation"
            isBusy={isPending}
            disabled={isPending || !token}
          />
        </form>
      </div>

      <PopUp
        open={showSuccess}
        title="Welcome aboard"
        description="Your account is ready. You're now signed in to your team dashboard."
        primaryButtonText="Go to dashboard"
        onClose={() => setShowSuccess(false)}
        onPrimaryAction={() => router.push("/dashboard")}
      />
    </>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={null}>
      <AcceptInviteForm />
    </Suspense>
  );
}
