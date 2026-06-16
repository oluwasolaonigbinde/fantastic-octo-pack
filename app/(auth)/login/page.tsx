"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, CustomCheckbox, Input } from "@/components/base";
import { AuthBackButton } from "@/components/features/auth/AuthBackButton";
import { SocialProviderButtons } from "@/components/features/auth/SocialProviderButtons";
import authService, { AuthApiError } from "@/services/authService";
import { useAppDispatch } from "@/hooks/useAppSelector";
import { setUser } from "@/store/slices/auth-slice";
import type { UserData } from "@/types/user";
import type { PendingRegistrationContext, PublicAuthEnvelope, RegistrationRole } from "@/types/auth";
import { loginSchema, type LoginFormData } from "./login.schema";
import {
  clearPendingAuthIntent,
  clearPendingRegistrationContext,
  mapAuthStepToPath,
  readPendingAuthIntent,
  readPendingRegistrationContext,
  writePendingRegistrationContext,
} from "@/utils/pendingAuth";
import { buildMessagingComposeHref } from "@/utils/messagingRoutes";
import type { PendingAuthIntent } from "@/types/auth";

function resolvePendingAuthRedirect(
  intent: PendingAuthIntent,
  role: string,
): {
  nextPath: string | null;
  clearIntentBeforeNavigation: boolean;
} {
  if (intent.action === "send_message") {
    return {
      nextPath: buildMessagingComposeHref(role, intent.receiverId),
      clearIntentBeforeNavigation: true,
    };
  }

  if (role !== "buyer") {
    return {
      nextPath: null,
      clearIntentBeforeNavigation: true,
    };
  }

  if (intent.action === "request_service") {
    const separator = intent.sourcePath.includes("?") ? "&" : "?";
    return {
      nextPath: `${intent.sourcePath}${separator}resumeAction=request_service`,
      clearIntentBeforeNavigation: false,
    };
  }

  if (intent.action === "send_inquiry") {
    const productName = encodeURIComponent(intent.productName || "");
    const sellerId = intent.sellerId || "";
    return {
      nextPath: `/dashboard/buyer/rfqs?action=create&product=${intent.productId}&productName=${productName}&seller=${sellerId}`,
      clearIntentBeforeNavigation: true,
    };
  }

  return {
    nextPath: `${intent.sourcePath}?resumeAction=order_now`,
    clearIntentBeforeNavigation: false,
  };
}

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormData) => {
    setIsLoading(true);
    setErrorMessage("");
    setInfoMessage("");

    try {
      const result = await authService.login(values);
      const onboardingState = result.data as {
        status?: string;
        nextStep?:
          | "verify_email"
          | "complete_signup"
          | "select_role"
          | "create_password";
        pendingRegistration?: {
          pendingRegistrationId: string;
          email: string;
          firstName?: string;
          lastName?: string;
          phoneNumber?: string;
          source: "manual" | "google" | "apple";
          isEmailVerified: boolean;
          role?: RegistrationRole;
          currentStep?:
            | "verify_email"
            | "complete_signup"
            | "select_role"
            | "create_password";
        };
      };
      const authenticatedUser = result.data as UserData;

      if (
        onboardingState.status === "onboarding_incomplete" &&
        onboardingState.pendingRegistration &&
        onboardingState.nextStep
      ) {
        clearPendingRegistrationContext();
        writePendingRegistrationContext({
          ...onboardingState.pendingRegistration,
          status: "onboarding_incomplete",
          nextStep: onboardingState.nextStep,
          acceptTerms: true,
        });
        setInfoMessage(
          "Your signup is not complete yet. Continue from where you stopped.",
        );
        return;
      }

      if (authenticatedUser?.tokens?.accessToken && authenticatedUser.role) {
        dispatch(setUser(authenticatedUser));
        const pendingAuthIntent = readPendingAuthIntent();

        if (pendingAuthIntent) {
          const { nextPath, clearIntentBeforeNavigation } =
            resolvePendingAuthRedirect(
              pendingAuthIntent,
              authenticatedUser.role,
            );

          if (clearIntentBeforeNavigation) {
            clearPendingAuthIntent();
          }

          if (nextPath) {
            router.push(nextPath);
            return;
          }
        }

        router.push("/dashboard");
        return;
      }

      setErrorMessage("Login did not return a valid account session.");
    } catch (error) {
      if (error instanceof AuthApiError) {
        setErrorMessage(error.message);
        return;
      }

      const isLikelyNetworkFailure =
        error instanceof TypeError ||
        (error instanceof Error &&
          /failed to fetch|networkerror|load failed/i.test(error.message));

      setErrorMessage(
        isLikelyNetworkFailure
          ? "Cannot reach the sign-in service. For local development, run the backend on port 4000 and set NEXT_PUBLIC_API_URL to http://localhost:4000/api/v1 (or leave it unset to use that default)."
          : error instanceof Error && error.message
            ? `Unable to log in right now. (${error.message})`
            : "Unable to log in right now.",
      );
    } finally {
      setIsLoading(false);
    }
  };

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
      dispatch(setUser(authenticatedUser));
      const pendingAuthIntent = readPendingAuthIntent();

      if (pendingAuthIntent) {
        const { nextPath, clearIntentBeforeNavigation } =
          resolvePendingAuthRedirect(
            pendingAuthIntent,
            authenticatedUser.role,
          );

        if (clearIntentBeforeNavigation) {
          clearPendingAuthIntent();
        }

        if (nextPath) {
          router.push(nextPath);
          return;
        }
      }

      router.push("/dashboard");
      return;
    }

    const onboardingState = result.data as {
      status?: string;
      nextStep?: PendingRegistrationContext["nextStep"];
      pendingRegistration?: PendingRegistrationContext;
    };

    if (
      onboardingState.status &&
      onboardingState.pendingRegistration &&
      onboardingState.nextStep
    ) {
      clearPendingRegistrationContext();
      writePendingRegistrationContext({
        ...onboardingState.pendingRegistration,
        status:
          onboardingState.status === "onboarding_incomplete"
            ? "onboarding_incomplete"
            : "pending_registration",
        nextStep: onboardingState.nextStep,
        acceptTerms: true,
      });
      router.push(mapAuthStepToPath(onboardingState.nextStep));
    }
  };

  return (
      <div className="mx-auto max-w-[414px]">
        <div className="mb-8">
          <Link href="/"><Image src="/logo.png" alt="logo" width={112} height={46} /></Link>
          <AuthBackButton onClick={() => router.back()} />
          <h1 className="type-heading-xxl mt-8 font-medium text-gray1">
            Welcome back!
          </h1>
        <p className="type-title-md mt-1 text-gray2">
          Login to your account to continue
        </p>
        <p className="type-heading-xl mt-6 text-gray1">
          Enter your email and password to sign in.
        </p>
      </div>

      {errorMessage ? (
        <div className="mb-4 rounded-xl border border-danger/30 bg-danger/5 p-4">
          <p className="text-sm text-danger">{errorMessage}</p>
        </div>
      ) : null}

      {infoMessage ? (
        <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-sm text-primary">{infoMessage}</p>
          <button
            type="button"
            onClick={() => {
              const pendingContext = readPendingRegistrationContext();
              if (pendingContext) {
                router.push(mapAuthStepToPath(pendingContext.nextStep));
              }
            }}
            className="mt-3 text-sm font-medium text-primary hover:underline"
          >
            Continue signup
          </button>
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

        <Input
          {...register("password")}
          id="password"
          type="password"
          label="Password"
          autoComplete="current-password"
          placeholder="Enter your password"
          error={
            errors.password && touchedFields.password
              ? errors.password.message
              : undefined
          }
        />

        <div className="flex items-center justify-between">
          <CustomCheckbox
            checked={rememberMe}
            onChange={() => setRememberMe(!rememberMe)}
            label="Remember me"
            id="rememberMe"
          />

          <Link href="/forgot-password" className="text-sm text-primary hover:underline">
            Forgot Password?
          </Link>
        </div>

        <Button
          type="submit"
          title="Sign in"
          isBusy={isLoading}
          disabled={isLoading}
        />
      </form>

      <p className="my-6 text-center text-base text-gray2">or</p>

      <SocialProviderButtons
        mode="login"
        onError={setErrorMessage}
        onResult={handleAuthResult}
      />

      <p className="mt-6 text-center text-sm text-gray1">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
