"use client";

import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button, Input, PopUp, RightSlider } from "@/components/base";
import { Textarea } from "@/components/ui/textarea";
import { SingleSelect } from "@/components/base";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { reset as clearFeedback, updateUser } from "@/store/slices/auth-slice";

interface EngineeringFormData {
  bio: string;
  specializations: string;
  equipmentTypes: string;
  oemTags: string;
  experienceYears: string;
  engineerAvailability: "available" | "busy";
}

function TagList({ label, items }: { label: string; items?: string[] }) {
  if (!items || items.length === 0) {
    return (
      <div>
        <p className="text-sm text-gray3">{label}</p>
        <p className="text-gray3 italic">Not set yet</p>
      </div>
    );
  }
  return (
    <div>
      <p className="text-sm text-gray3">{label}</p>
      <div className="mt-1 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="inline-block rounded-full bg-primary-light px-3 py-1 text-xs font-medium text-primary-dark"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function EditEngineeringForm({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState(false);
  const dispatch = useAppDispatch();
  const { data, isError, isLoading, lastCompletedAction, message } =
    useAppSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
  } = useForm<EngineeringFormData>({
    defaultValues: {
      bio: data?.bio || "",
      specializations: (data?.specializations ?? []).join(", "),
      equipmentTypes: (data?.equipmentTypes ?? []).join(", "),
      oemTags: (data?.oemTags ?? []).join(", "),
      experienceYears: data?.experienceYears?.toString() || "",
      engineerAvailability: data?.engineerAvailability || "available",
    },
  });

  useEffect(() => {
    reset({
      bio: data?.bio || "",
      specializations: (data?.specializations ?? []).join(", "),
      equipmentTypes: (data?.equipmentTypes ?? []).join(", "),
      oemTags: (data?.oemTags ?? []).join(", "),
      experienceYears: data?.experienceYears?.toString() || "",
      engineerAvailability: data?.engineerAvailability || "available",
    });
  }, [data, reset]);

  const availabilityValue = watch("engineerAvailability");

  const onSubmit = async (formData: EngineeringFormData) => {
    if (!data?.tokens?.accessToken) return;

    const splitTrim = (val: string) =>
      val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    await dispatch(clearFeedback());

    try {
      await dispatch(
        updateUser({
          token: data.tokens.accessToken,
          formData: {
            bio: formData.bio || undefined,
            specializations: splitTrim(formData.specializations),
            equipmentTypes: splitTrim(formData.equipmentTypes),
            oemTags: splitTrim(formData.oemTags),
            experienceYears: formData.experienceYears
              ? Number(formData.experienceYears)
              : undefined,
            engineerAvailability: formData.engineerAvailability,
          },
        })
      ).unwrap();
      setOpen(true);
    } catch {
      // Error captured by slice state
    }
  };

  if (open) {
    return (
      <PopUp
        description="Your engineering profile has been updated successfully"
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
      <Textarea
        id="bio"
        {...register("bio")}
        rows={4}
        label="Professional Bio"
        placeholder="Describe your engineering experience and expertise..."
        className="resize-none"
      />

      <Input
        id="specializations"
        {...register("specializations")}
        label="Specializations"
        placeholder="e.g. HVAC, Electrical, Plumbing (comma-separated)"
      />

      <Input
        id="equipmentTypes"
        {...register("equipmentTypes")}
        label="Equipment Types"
        placeholder="e.g. Pumps, Compressors, Generators (comma-separated)"
      />

      <Input
        id="oemTags"
        {...register("oemTags")}
        label="OEM Brand Tags"
        placeholder="e.g. Caterpillar, Cummins, Siemens (comma-separated)"
      />

      <Input
        id="experienceYears"
        type="number"
        {...register("experienceYears")}
        label="Years of Experience"
        placeholder="e.g. 5"
      />

      <SingleSelect
        label="Availability Status"
        placeholder="Select status"
        value={availabilityValue}
        onValueChange={(v) =>
          setValue("engineerAvailability", v as "available" | "busy")
        }
        options={[
          { label: "Available", value: "available" },
          { label: "Busy", value: "busy" },
        ]}
      />

      {isError && lastCompletedAction === "updateUser" ? (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{message}</p>
        </div>
      ) : null}

      <Button
        title="Update Engineering Profile"
        type="submit"
        isBusy={isLoading}
        disabled={isLoading}
      />
    </form>
  );
}

export default function AboutEngineering() {
  const { data } = useAppSelector((state) => state.auth);
  const [editing, setEditing] = useState(false);

  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <div className="rounded-lg bg-white p-6">
      <div className="flex items-center justify-between border-b border-gray5 pb-6">
        <div>
          <h2 className="medium4">Engineering Profile</h2>
          <p className="text-sm text-gray3">
            Manage your professional engineering details visible to buyers.
          </p>
        </div>
        <Button
          title="Edit Engineering Info"
          iconLeft={<Pencil size={16} />}
          onClick={() => setEditing(true)}
          className="md:!w-fit"
        />
      </div>

      <div className="mt-6 space-y-6">
        <div>
          <p className="text-sm text-gray3">Professional Bio</p>
          <p>{data.bio || "Not set yet"}</p>
        </div>

        <div className="flex flex-col gap-6 md:flex-row">
          <div>
            <p className="text-sm text-gray3">Years of Experience</p>
            <p>
              {data.experienceYears !== undefined
                ? `${data.experienceYears} years`
                : "Not set yet"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray3">Availability</p>
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                data.engineerAvailability === "busy"
                  ? "bg-orange-100 text-orange-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {data.engineerAvailability === "busy" ? "Busy" : "Available"}
            </span>
          </div>
        </div>

        <TagList label="Specializations" items={data.specializations} />
        <TagList label="Equipment Types" items={data.equipmentTypes} />
        <TagList label="OEM Brand Tags" items={data.oemTags} />
      </div>

      <RightSlider
        title="Edit Engineering Info"
        open={editing}
        onClose={() => setEditing(false)}
      >
        <EditEngineeringForm onClose={() => setEditing(false)} />
      </RightSlider>
    </div>
  );
}
