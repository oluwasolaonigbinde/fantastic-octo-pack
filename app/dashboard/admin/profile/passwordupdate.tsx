"use client";

import React, { useState } from "react";
import { Button } from "@/components/base";
import { Input } from "@/components/base";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PasswordFormData, passwordSchema } from "./schemas/password.schema";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { PopUp } from "@/components/base";
import { reset as clearMessage, updatePassword } from "@/store/slices/auth-slice";

const PasswordUpdate = () => {
  const dispatch = useAppDispatch();
  const { data, isLoading, isError, isSuccess, message } = useAppSelector(
    (state) => state.auth
  );
  const [success, setSuccess] = useState(false);

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
    const formData = {
      currentPassword: getValues("currentPassword"),
      newPassword: getValues("newPassword"),
    };
    try {
      await dispatch(clearMessage());
      await dispatch(
        updatePassword({ token: data?.tokens?.accessToken as string, formData })
      );
    } catch (error) {
      console.log("Error updating password:", error);
    }

    if (isSuccess) {
      setSuccess(true);
    }
  };

  // useEffect(() => {
  //   setSuccess(true);
  // }, [dispatch]);

  if (success) {
    return (
      <PopUp
        open={isSuccess}
        description="You have successfully updated your password. Please keep it safe"
        onClose={() => {
          setSuccess(false);
          reset();
        }}
      />
    );
  }

  return (
    <div className="min-h-[650px] rounded-[12px] border border-gray5 bg-white p-6">
      <h2 className="text-xl font-medium leading-8 text-gray1">Account Settings</h2>
      <p className="mt-1 text-base leading-6 text-gray2">
        Make security updates and password changes to your account.
      </p>
      <div className="mt-8 max-w-[644px]">
        <h3 className="text-lg font-medium leading-6 text-gray1">Password change</h3>
        <p className="mt-2 text-base leading-6 text-gray2">
          To change your password, kindly enter your current password and the
          new password you want to change to.
        </p>
      </div>

      {isError && (
        <div className="my-4 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-200">{message}</p>
        </div>
      )}

      <form className="mt-8 max-w-[664px] space-y-8" onSubmit={handleSubmit(onSubmit)}>
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
              errors.newPassword && touchedFields.newPassword
                ? errors.newPassword.message
                : undefined
            }
          />
        </div>
        <Button
          title="Save Password"
          type="submit"
          className="h-[60px] w-full rounded-[14px] text-lg md:max-w-[320px]"
          isBusy={isLoading}
        />
      </form>
    </div>
  );
};

export default PasswordUpdate;

