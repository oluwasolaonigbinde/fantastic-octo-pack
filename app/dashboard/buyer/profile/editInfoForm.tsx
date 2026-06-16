 "use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button, Input, PopUp } from "@/components/base";
import { Textarea } from "@/components/ui/textarea";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { reset as clearFeedback, updateUser } from "@/store/slices/auth-slice";

import { editInfoSchema, EditFormData } from "./schemas/editinfoschema";

interface EditInfoFormProps {
  onClose: () => void;
}

const toDateInputValue = (value?: Date | string | null) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  return value.toISOString().slice(0, 10);
};

const EditInfoForm = ({ onClose }: EditInfoFormProps) => {
  const [open, setOpen] = useState(false);
  const dispatch = useAppDispatch();
  const { data, isError, isLoading, lastCompletedAction, message } = useAppSelector(
    (state) => state.auth,
  );

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
      dateOfBirth: toDateInputValue(data?.dateOfBirth),
    },
  });

  useEffect(() => {
    reset({
      firstName: data?.firstName || "",
      lastName: data?.lastName || "",
      phoneNumber: data?.phoneNumber || "",
      address: data?.address || "",
      dateOfBirth: toDateInputValue(data?.dateOfBirth),
    });
  }, [data?.address, data?.dateOfBirth, data?.firstName, data?.lastName, data?.phoneNumber, reset]);

  const onSubmit = async (formData: EditFormData) => {
    if (!data?.tokens?.accessToken) {
      return;
    }

    await dispatch(clearFeedback());

    try {
      await dispatch(
        updateUser({
          token: data.tokens.accessToken,
          formData,
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
      <Input
        id="dateOfBirth"
        type="date"
        {...register("dateOfBirth", {
          onBlur: () => trigger("dateOfBirth"),
        })}
        label="Date of Birth"
        error={
          errors.dateOfBirth && touchedFields.dateOfBirth
            ? errors.dateOfBirth.message
            : undefined
        }
      />
      <Input value={data?.role || ""} label="Role" disabled />
      <Textarea
        id="address"
        {...register("address", {
          onBlur: () => trigger("address"),
        })}
        rows={3}
        label="Address"
        name="address"
        error={
          errors.address && touchedFields.address ? errors.address.message : undefined
        }
        className="resize-none"
      />
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
