"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/base";
import { AuthBackButton } from "@/components/features/auth/AuthBackButton";
import { RoleToggle } from "@/components/features/auth/RoleToggle";
import authService, { AuthApiError } from "@/services/authService";
import { useAppDispatch } from "@/hooks/useAppSelector";
import { setUser } from "@/store/slices/auth-slice";
import type { UserData } from "@/types/user";
import {
  clearPendingRegistrationContext,
  mapAuthStepToPath,
  readPendingRegistrationContext,
  writePendingRegistrationContext,
} from "@/utils/pendingAuth";
import type { PendingRegistrationContext } from "@/types/auth";

export default function SelectRolePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [pendingContext] = useState<PendingRegistrationContext | null>(() =>
    readPendingRegistrationContext(),
  );
  const [selectedRole, setSelectedRole] = useState<
    "buyer" | "distributor" | "engineer" | "oem" | undefined
  >(() => readPendingRegistrationContext()?.role);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const storedContext = readPendingRegistrationContext();

    if (!storedContext) {
      router.replace("/register");
      return;
    }

    if (storedContext.nextStep !== "select_role") {
      router.replace(mapAuthStepToPath(storedContext.nextStep));
      return;
    }
  }, [router]);

  const handleProceed = async () => {
    if (!pendingContext || !selectedRole) {
      setErrorMessage("Please select who you are registering as.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await authService.selectRegistrationRole({
        pendingRegistrationId: pendingContext.pendingRegistrationId,
        role: selectedRole,
      });

      const authenticatedUser = result.data as UserData;

      if (authenticatedUser?.tokens?.accessToken && authenticatedUser.role) {
        clearPendingRegistrationContext();
        dispatch(setUser(authenticatedUser));
        router.push("/dashboard");
        return;
      }

      const nextContext = authService.toPendingRegistrationContext(
        result.data as {
          status: string;
          nextStep: PendingRegistrationContext["nextStep"];
        },
        {
          firstName: pendingContext.firstName,
          lastName: pendingContext.lastName,
          phoneNumber: pendingContext.phoneNumber,
          acceptTerms: pendingContext.acceptTerms,
        },
      );

      if (!nextContext) {
        throw new Error("Unable to continue signup.");
      }

      writePendingRegistrationContext(nextContext);
      router.push(mapAuthStepToPath(nextContext.nextStep));
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

      setErrorMessage("Unable to save your role selection right now.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-[414px]">
      <div className="mb-8">
        <Image src="/logo.png" alt="logo" width={112} height={46} />
        <AuthBackButton onClick={() => router.push("/register")} />
        <h1 className="type-heading-xxl mt-8 font-medium text-gray1">
          Register User
        </h1>
        <p className="type-title-md mt-3 text-gray2">
          Select who you&apos;re registering as:
        </p>
      </div>

      {errorMessage ? (
        <div className="mb-4 rounded-xl border border-danger/30 bg-danger/5 p-4">
          <p className="text-sm text-danger">{errorMessage}</p>
        </div>
      ) : null}

      <RoleToggle
        value={selectedRole}
        onChange={(value) => setSelectedRole(value)}
      />

      <Button
        type="button"
        title="Proceed"
        className="mt-8"
        isBusy={isLoading}
        disabled={isLoading || !selectedRole}
        onClick={handleProceed}
      />

    </div>
  );
}
