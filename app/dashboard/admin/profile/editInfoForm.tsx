"use client";

import { Input } from "@/components/base";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { editInfoSchema, EditFormData } from "./schemas/editinfoschema";
import { PopUp } from "@/components/base";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/base";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { updateUser } from "@/store/slices/auth-slice";
// import { reset } from "@/store/slices/auth-slice";

interface EditInfoFormProps {
  onClose: () => void;
}

const EditInfoForm = ({ onClose }: EditInfoFormProps) => {
  const [open, setOpen] = useState(false);
  const dispatch = useAppDispatch();
  const { data, isSuccess, isError,isLoading, message } = useAppSelector(
    (state) => state.auth
  );

  const {
    register,
    handleSubmit,
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

  // useEffect(() => {
  //   if (isSuccess) {
  //     setOpen(true);
  //   }
  // }, [isLoading]);

  const onSubmit = async (formData: EditFormData) => {
    // await dispatch(reset())
    await dispatch(
      updateUser({ token: data?.tokens?.accessToken as string, formData })
    );
    if (isSuccess) {
      setOpen(true);
    }
  };

  if (open) {
    return (
      <PopUp
        description="Your personal info has been updated succesfully"
        open={open}
        onClose={() => {
          setOpen(false);
          onClose();
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Input
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
        {...register("lastName", {
          onBlur: () => trigger("lastName"),
        })}
        label="Last Name"
        name="lastName"
        error={
          errors.lastName && touchedFields.lastName
            ? errors.lastName.message
            : undefined
        }
      />
      <Input label="Email address" value={data?.email || ""} disabled />
      <Input
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
      <Textarea
        {...register("address", {
          onBlur: () => trigger("address"),
        })}
        rows={3}
        label="Address"
        name="address"
        error={
          errors.address && touchedFields.address
            ? errors.address.message
            : undefined
        }
        className="resize-none"
      />
      <Button title="Update Personal Information" type="submit" />
    </form>
  );
};

export default EditInfoForm;

