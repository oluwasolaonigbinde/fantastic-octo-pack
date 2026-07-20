 "use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button, Input, PopUp } from "@/components/base";
import { Textarea } from "@/components/base";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { UserRole } from "@/types/user";
import { reset as clearFeedback, updateUser } from "@/store/slices/auth-slice";

import { editInfoSchema, EditFormData } from "./schemas/editinfoschema";

interface EditInfoFormProps {
  onClose: () => void;
}

const EditInfoForm = ({ onClose }: EditInfoFormProps) => {
  const [open, setOpen] = useState(false);
  const dispatch = useAppDispatch();
  const { data, isError, isLoading, lastCompletedAction, message } = useAppSelector(
    (state) => state.auth,
  );

  // Buyers keep a structured delivery-address book instead; the backend strips
  // `address` from their profile updates, so we only surface it for other roles.
  const supportsAddress = !!data?.role && data.role !== UserRole.BUYER;

  const {
    register,
    handleSubmit,
    reset,
    trigger,
    formState: { errors, touchedFields },
  } = useForm<EditFormData>({
    resolver: zodResolver(editInfoSchema),
    defaultValues: {
      firstName: data?.firstName || "",
      lastName: data?.lastName || "",
      phoneNumber: data?.phoneNumber || "",
      address: data?.address || "",
    },
  });

  useEffect(() => {
    reset({
      firstName: data?.firstName || "",
      lastName: data?.lastName || "",
      phoneNumber: data?.phoneNumber || "",
      address: data?.address || "",
    });
  }, [
    data?.firstName,
    data?.lastName,
    data?.phoneNumber,
    data?.address,
    reset,
  ]);

  const onSubmit = async (formData: EditFormData) => {
    if (!data?.tokens?.accessToken) {
      return;
    }

    await dispatch(clearFeedback());

    const { address, ...rest } = formData;

    try {
      await dispatch(
        updateUser({
          token: data.tokens.accessToken,
          formData: supportsAddress ? { ...rest, address: address || undefined } : rest,
        }),
      ).unwrap();
      setOpen(true);
    } catch {
      // The slice state already stores the backend error message.
    }
  };

  if (open) {
    return (
      <PopUp
        description="Your personal info has been updated succesfully"
        open={open}
        onClose={() => {
          setOpen(false);
          void dispatch(clearFeedback());
          onClose();
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Input
        id="firstName"
        maxLength={50}
        {...register("firstName", {
          onBlur: () => trigger("firstName"),
        })}
        label="First Name"
        name="firstName"
        error={
          errors.firstName && touchedFields.firstName
            ? errors.firstName.message
            : undefined
        }
      />
      <Input
        id="lastName"
        maxLength={50}
        {...register("lastName", {
          onBlur: () => trigger("lastName"),
        })}
        label="Last Name"
        name="lastName"
        error={
          errors.lastName && touchedFields.lastName ? errors.lastName.message : undefined
        }
      />
      <Input label="Email address" value={data?.email || ""} disabled />
      <Input
        id="phoneNumber"
        maxLength={20}
        {...register("phoneNumber", {
          onBlur: () => trigger("phoneNumber"),
        })}
        label="Phone Number"
        name="phoneNumber"
        error={
          errors.phoneNumber && touchedFields.phoneNumber
            ? errors.phoneNumber.message
            : undefined
        }
      />
      <Input value={data?.role || ""} label="Role" disabled />
      {supportsAddress ? (
        <Textarea
          id="address"
          rows={3}
          maxLength={255}
          {...register("address", {
            onBlur: () => trigger("address"),
          })}
          label="Address"
          placeholder="e.g. No 38 Ashiek Jarma Street, Nasarawa State"
          className="resize-none"
          error={
            errors.address && touchedFields.address ? errors.address.message : undefined
          }
        />
      ) : null}
      {isError && lastCompletedAction === "updateUser" ? (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{message}</p>
        </div>
      ) : null}
      <Button
        title="Update Personal Information"
        type="submit"
        isBusy={isLoading}
        disabled={isLoading}
      />
    </form>
  );
};

export default EditInfoForm;
