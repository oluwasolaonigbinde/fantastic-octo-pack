"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button, Input, PopUp, SingleSelect } from "@/components/base";
import { Textarea } from "@/components/ui/textarea";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { updateUser } from "@/store/slices/auth-slice";

import { EditFormData, editInfoSchema } from "./schemas/editinfoschema";

interface EditInfoFormProps {
  onClose: () => void;
}

const splitName = (value: string) => {
  const parts = value.trim().split(/\s+/).filter(Boolean);

  if (parts.length <= 1) {
    return {
      firstName: parts[0] || "",
      lastName: "",
    };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
};

export default function EditInfoForm({ onClose }: EditInfoFormProps) {
  const dispatch = useAppDispatch();
  const { data } = useAppSelector((state) => state.auth);
  const [showSuccess, setShowSuccess] = useState(false);

  const defaultName = useMemo(
    () => `${data?.firstName || ""} ${data?.lastName || ""}`.trim(),
    [data?.firstName, data?.lastName],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields, isSubmitting },
  } = useForm<EditFormData>({
    resolver: zodResolver(editInfoSchema),
    defaultValues: {
      name: defaultName,
      phoneNumber: data?.phoneNumber || "",
      dateOfBirth:
        typeof data?.dateOfBirth === "string" ? data.dateOfBirth.slice(0, 10) : "",
      address: data?.address || "",
    },
  });

  const onSubmit = async (values: EditFormData) => {
    if (!data?.tokens?.accessToken) {
      return;
    }

    const { firstName, lastName } = splitName(values.name);

    await dispatch(
      updateUser({
        token: data.tokens.accessToken,
        formData: {
          firstName,
          lastName,
          phoneNumber: values.phoneNumber,
          dateOfBirth: values.dateOfBirth,
          address: values.address,
        },
      }),
    ).unwrap();

    setShowSuccess(true);
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          {...register("name")}
          id="oem-edit-name"
          label="Name"
          error={touchedFields.name ? errors.name?.message : undefined}
        />
        <Input id="oem-edit-email" label="Email address" value={data?.email || ""} disabled />
        <Input
          {...register("phoneNumber")}
          id="oem-edit-phone"
          label="Phone number"
          error={touchedFields.phoneNumber ? errors.phoneNumber?.message : undefined}
        />
        <Input
          {...register("dateOfBirth")}
          id="oem-edit-dob"
          label="Date of birth"
          type="date"
          error={touchedFields.dateOfBirth ? errors.dateOfBirth?.message : undefined}
        />
        <SingleSelect
          label="Role"
          value={data?.role || "oem"}
          options={[{ value: data?.role || "oem", label: (data?.role || "oem").replace("_", " ") }]}
        />
        <Textarea
          {...register("address")}
          id="oem-edit-address"
          label="Address"
          rows={5}
          error={touchedFields.address ? errors.address?.message : undefined}
        />
        <Button
          title="Update Personal Information"
          type="submit"
          isBusy={isSubmitting}
          className="rounded-2xl"
        />
      </form>

      <PopUp
        open={showSuccess}
        type="success"
        title="Congratulations"
        description="Your personal information have been updated successfully."
        primaryButtonText="Okay"
        onClose={() => {
          setShowSuccess(false);
          onClose();
        }}
      />
    </>
  );
}
