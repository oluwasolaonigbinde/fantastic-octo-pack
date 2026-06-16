"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { XCircle } from "lucide-react";

import { Button, Input, PopUp } from "@/components/base";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { reset as clearMessage, updatePassword } from "@/store/slices/auth-slice";

import { PasswordFormData, passwordSchema } from "./schemas/password.schema";

const PasswordUpdate = () => {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data, isLoading, isError, message, lastCompletedAction } = useAppSelector(
    (state) => state.auth,
  );
  const [success, setSuccess] = useState(false);
  const forceErrorState = searchParams.get("state") === "error";

  const {
    register,
    handleSubmit,
    trigger,
    reset,
    getValues,
    formState: { errors, touchedFields },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async () => {
    if (!data?.tokens?.accessToken) {
      return;
    }

    const formData = {
      currentPassword: getValues("currentPassword"),
      newPassword: getValues("newPassword"),
    };

    await dispatch(clearMessage());

    try {
      await dispatch(
        updatePassword({ token: data.tokens.accessToken, formData }),
      ).unwrap();
      setSuccess(true);
      reset();
    } catch {
      // The slice state already stores the backend error message.
    }
  };

  if (success) {
    return (
      <PopUp
        open={success}
        description="You have successfully updated your password. Please keep it safe"
        onClose={() => {
          setSuccess(false);
          void dispatch(clearMessage());
          reset();
        }}
      />
    );
  }

  return (
    <div className="rounded-md bg-white p-6">
      {forceErrorState ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#FEE2E2]">
              <XCircle size={30} className="text-[#DC2626]" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-[#111827]">
              Password update failed
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#6B7280]">
              The current password could not be verified. Check your information
              and try again.
            </p>
            <Link
              href={`${pathname}?tab=password`}
              className="mt-6 inline-flex w-full justify-center rounded-xl bg-[#0669D9] px-5 py-3 text-sm font-medium text-white"
            >
              Try again
            </Link>
          </div>
        </div>
      ) : null}

      <h2 className="medium3">Password Update</h2>
      <p className="text-sm text-gray2">
        To change your password, kindly enter your current password and the new
        password you want to change to.
      </p>

      {isError && lastCompletedAction === "updatePassword" ? (
        <div className="my-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{message}</p>
        </div>
      ) : null}

      <form className="mt-6 space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <Input
          {...register("currentPassword", {
            onBlur: () => trigger("currentPassword"),
          })}
          label="Current password"
          id="currentPassword"
          type="password"
          placeholder="Enter your current password"
          error={
            errors.currentPassword && touchedFields.currentPassword
              ? errors.currentPassword.message
              : undefined
          }
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Input
            {...register("newPassword", {
              onBlur: () => trigger("newPassword"),
            })}
            label="New password"
            id="newPassword"
            type="password"
            placeholder="Enter your new password"
            error={
              errors.newPassword && touchedFields.newPassword
                ? errors.newPassword.message
                : undefined
            }
          />
          <Input
            {...register("confirmPassword", {
              onBlur: () => trigger("confirmPassword"),
            })}
            label="Confirm password"
            type="password"
            id="confirmPassword"
            placeholder="Enter your new password again"
            error={
              errors.confirmPassword && touchedFields.confirmPassword
                ? errors.confirmPassword.message
                : undefined
            }
          />
        </div>
        <Button
          title="Save Password"
          type="submit"
          className="w-full md:max-w-[320px]"
          isBusy={isLoading}
          disabled={isLoading}
        />
      </form>
    </div>
  );
};

export default PasswordUpdate;
