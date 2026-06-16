"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, CustomCheckbox, Input } from "@/components/base";
import { AuthBackButton } from "@/components/features/auth/AuthBackButton";
import { SocialProviderButtons } from "@/components/features/auth/SocialProviderButtons";
import authService, { AuthApiError } from "@/services/authService";
import { useAppDispatch } from "@/hooks/useAppSelector";
import { setUser } from "@/store/slices/auth-slice";
import type { PendingRegistrationContext, PublicAuthEnvelope } from "@/types/auth";
import type { UserData } from "@/types/user";
import { RegisterSchema, type RegisterFormData } from "./register.schema";
import {
  clearPendingRegistrationContext,
  mapAuthStepToPath,
  readPendingRegistrationContext,
  writePendingRegistrationContext,
} from "@/utils/pendingAuth";

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [mode, setMode] = useState<"chooser" | "email">("chooser");

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
    setValue,
    control,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(RegisterSchema),
    mode: "onBlur",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      acceptTerms: false,
    },
  });

  const acceptTerms = useWatch({ control, name: "acceptTerms" });

  useEffect(() => {
    const pending = readPendingRegistrationContext();

    if (!pending) {
      return;
    }

    if (pending.nextStep === "verify_email") {
      router.replace("/verify-email");
      return;
    }

    if (pending.nextStep !== "login") {
      router.replace(mapAuthStepToPath(pending.nextStep));
      return;
    }
  }, [router]);

  const handleAuthResult = async (
    result: PublicAuthEnvelope<
      UserData | {
        status?: string;
        nextStep?: string;
        pendingRegistration?: unknown;
      }
    >,
  ) => {
    const authenticatedUser = result.data as UserData;

    if (authenticatedUser?.tokens?.accessToken && authenticatedUser.role) {
      clearPendingRegistrationContext();
      dispatch(setUser(authenticatedUser));
      router.push("/dashboard");
      return;
    }

    const pendingRegistrationContext = authService.toPendingRegistrationContext(
      result.data as {
        status: string;
        nextStep: PendingRegistrationContext["nextStep"];
        pendingRegistration?: PendingRegistrationContext;
      },
      {
        acceptTerms: true,
      },
    );

    if (!pendingRegistrationContext) {
      throw new Error("Signup could not be resumed.");
    }

    writePendingRegistrationContext(pendingRegistrationContext);
    router.push(mapAuthStepToPath(pendingRegistrationContext.nextStep));
  };

  const onSubmit = async (values: RegisterFormData) => {
    setIsSubmitting(true);
    setFormError("");

    try {
      const result = await authService.startRegistration(values);

      if (result.data.status === "account_exists") {
        clearPendingRegistrationContext();
        setFormError(result.message);
        return;
      }

      const pendingRegistrationContext = authService.toPendingRegistrationContext(
        result.data,
        {
          firstName: values.firstName,
          lastName: values.lastName,
          phoneNumber: values.phoneNumber,
          acceptTerms: values.acceptTerms,
        },
      );

      if (!pendingRegistrationContext) {
        throw new Error("Signup could not be resumed.");
      }

      writePendingRegistrationContext(pendingRegistrationContext);
      router.push("/verify-email");
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

      setFormError("Unable to start signup right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (mode === "chooser") {
    return (
      <div className="mx-auto max-w-[414px]">
        <div className="mb-8">
          <Image src="/logo.png" alt="logo" width={112} height={46} />
          <AuthBackButton onClick={() => router.push("/login")} />
          <h1 className="type-heading-xxl mt-8 font-medium text-gray1">
            Register
          </h1>
          <p className="type-title-md mt-2 text-gray2">
            Select to continue registration
          </p>
        </div>

        {formError ? (
          <div className="mb-4 rounded-xl border border-danger/30 bg-danger/5 p-4">
            <p className="text-sm text-danger">{formError}</p>
          </div>
        ) : null}

        <Button
          type="button"
          title="Register with Email"
          onClick={() => {
            setFormError("");
            setMode("email");
          }}
        />

        <div className="mt-6">
          <SocialProviderButtons
            mode="signup"
            onError={setFormError}
            onResult={handleAuthResult}
          />
        </div>

        <p className="mt-4 text-center text-sm text-gray1">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign In
          </Link>
        </p>

      </div>
    );
  }

  return (
      <div className="mx-auto max-w-[414px]">
        <div className="mb-8">
          <Image src="/logo.png" alt="logo" width={112} height={46} />
          <AuthBackButton
            onClick={() => {
              setFormError("");
              setMode("chooser");
            }}
          />
          <h1 className="type-heading-xxl mt-8 font-medium text-gray1">
            Sign up
          </h1>
        <p className="type-title-md mt-3 text-gray2">
          Enter your details below to create your account.
        </p>
      </div>

      {formError ? (
        <div className="mb-4 rounded-xl border border-danger/30 bg-danger/5 p-4">
          <p className="text-sm text-danger">{formError}</p>
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        <Input
          {...register("firstName")}
          id="firstName"
          label="First name"
          placeholder="Enter your first name"
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
          placeholder="Enter your last name"
          error={
            errors.lastName && touchedFields.lastName
              ? errors.lastName.message
              : undefined
          }
        />

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

        <Input
          {...register("phoneNumber")}
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

        <div>
          <CustomCheckbox
            id="acceptTerms"
            checked={acceptTerms}
            onChange={(checked) =>
              setValue("acceptTerms", checked, {
                shouldValidate: true,
              })
            }
            label="I accept the Terms & Condition and have read the Privacy Policy"
          />
          {errors.acceptTerms ? (
            <p className="mt-2 text-sm text-danger">{errors.acceptTerms.message}</p>
          ) : null}
        </div>

        <Button
          type="submit"
          title="Sign up"
          isBusy={isSubmitting}
          disabled={isSubmitting}
        />
      </form>

      <p className="mt-6 text-center text-sm text-gray1">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>

    </div>
  );
}
