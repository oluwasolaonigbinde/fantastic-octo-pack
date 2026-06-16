"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button, Input, PopUp } from "@/components/base";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { updatePassword } from "@/store/slices/auth-slice";

import { PasswordFormData, passwordSchema } from "./schemas/password.schema";

export default function PasswordUpdate() {
  const dispatch = useAppDispatch();
  const { data, message } = useAppSelector((state) => state.auth);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields, isSubmitting },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: PasswordFormData) => {
    if (!data?.tokens?.accessToken) {
      return;
    }

    setSubmitError("");

    try {
      await dispatch(
        updatePassword({
          token: data.tokens.accessToken,
          formData: {
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
          },
        }),
      ).unwrap();
      setShowSuccess(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : message || "Password update failed");
    }
  };

  return (
    <>
      <div className="rounded-[24px] border border-[#E8ECF4] bg-white p-5 shadow-sm">
        <h2 className="text-[32px] font-semibold text-gray1">Password Update</h2>
        <p className="mt-2 max-w-[760px] text-sm leading-6 text-gray2">
          To change your password, kindly enter your current password and the new password you
          want to change to.
        </p>

        {submitError ? <p className="mt-4 text-sm text-danger">{submitError}</p> : null}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <Input
            {...register("currentPassword")}
            id="oem-current-password"
            type="password"
            label="Current password"
            placeholder="Enter your current password"
            error={touchedFields.currentPassword ? errors.currentPassword?.message : undefined}
          />
          <div className="grid gap-6 md:grid-cols-2">
            <Input
              {...register("newPassword")}
              id="oem-new-password"
              type="password"
              label="New password"
              placeholder="Enter your new password"
              error={touchedFields.newPassword ? errors.newPassword?.message : undefined}
            />
            <Input
              {...register("confirmPassword")}
              id="oem-confirm-password"
              type="password"
              label="Confirm password"
              placeholder="Enter your new password again"
              error={touchedFields.confirmPassword ? errors.confirmPassword?.message : undefined}
            />
          </div>
          <div className="max-w-[320px]">
            <Button
              title="Save Password"
              type="submit"
              isBusy={isSubmitting}
              className="rounded-2xl"
            />
          </div>
        </form>
      </div>

      <PopUp
        open={showSuccess}
        type="success"
        title="Congratulations"
        description="You have successfully updated your password. Please keep it safe"
        primaryButtonText="Okay"
        onClose={() => setShowSuccess(false)}
      />
    </>
  );
}
