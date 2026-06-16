"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input } from "@/components/base";
import { AuthBackButton } from "@/components/features/auth/AuthBackButton";
import authService, { AuthApiError } from "@/services/authService";
import {
  clearPendingResetContext,
  writePendingResetContext,
} from "@/utils/pendingAuth";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "./forgot-password.schema";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordFormData) => {
    setIsLoading(true);
    setErrorMessage("");
    setInfoMessage("");

    try {
      const result = await authService.forgotPassword(values.email);

      clearPendingResetContext();
      writePendingResetContext({
        email: values.email,
      });
      setInfoMessage(result.message);
      router.push("/verify-otp");
    } catch (error) {
      if (error instanceof AuthApiError) {
        setErrorMessage(error.message);
        return;
      }

      setErrorMessage("Unable to start password reset right now.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-[414px]">
      <div className="mb-8">
        <Link href="/"><Image src="/logo.png" alt="logo" width={112} height={46} /></Link>
        <AuthBackButton
          label="Go back to the Log in Page"
          onClick={() => router.back()}
        />
        <h1 className="type-heading-xxl mt-8 font-medium text-gray1">
          Forgot Password?
        </h1>
        <p className="type-title-md mt-3 text-gray2">
          Enter the email address associated to your account and we will send
          you a code to reset your password.
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

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        <Input
          {...register("email")}
          id="email"
          type="email"
          label="Email address"
          autoComplete="email"
          placeholder="Enter your email address"
          error={
            errors.email && touchedFields.email ? errors.email.message : undefined
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
