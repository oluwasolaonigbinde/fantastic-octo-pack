"use client";

import { useMemo, useState } from "react";
import { Camera, Pencil } from "lucide-react";

import { Button, RightSlider } from "@/components/base";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { uploadDisplayPhoto } from "@/store/slices/auth-slice";
import { formatDate } from "@/utils/formatDate";
import { DEFAULT_AVATAR_SRC } from "@/constants/avatar";
import { getPartyDisplayName, getPersonalName } from "@/utils/partyDisplayName";

import EditInfoForm from "./editInfoForm";

export default function PersonalDetails() {
  const dispatch = useAppDispatch();
  const { data } = useAppSelector((state) => state.auth);
  const [editing, setEditing] = useState(false);

  const displayName = useMemo(() => getPartyDisplayName(data, "--"), [data]);
  const personalName = useMemo(() => getPersonalName(data), [data]);

  const details = [
    { label: "Name", value: personalName || "--" },
    { label: "Email address", value: data?.email || "--" },
    { label: "Phone number", value: data?.phoneNumber || "--" },
    {
      label: "Date of birth",
      value: data?.dateOfBirth ? formatDate(data.dateOfBirth) : "--",
    },
    { label: "Role", value: data?.role || "--" },
    { label: "Address", value: data?.address || "--" },
  ];

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file || !data?.tokens?.accessToken) {
      return;
    }

    await dispatch(
      uploadDisplayPhoto({
        token: data.tokens.accessToken,
        fileData: { file },
      }),
    );
  };

  return (
    <div className="space-y-4">
      <section className="flex flex-col justify-between gap-4 rounded-[24px] border border-[#E8ECF4] bg-white p-5 shadow-sm lg:flex-row lg:items-center">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="size-16 rounded-full bg-[#EDF2FF]">
              <AvatarImage
                src={data?.displayPhoto?.url || DEFAULT_AVATAR_SRC}
                alt={displayName}
              />
              <AvatarFallback className="bg-[#EDF2FF] text-primary">
                {displayName
                  .split(" ")
                  .map((part) => part.charAt(0))
                  .join("")
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <label
              htmlFor="oem-profile-photo"
              className="absolute -bottom-1 -right-1 inline-flex size-8 cursor-pointer items-center justify-center rounded-full bg-white shadow"
            >
              <Camera size={16} />
            </label>
            <input
              id="oem-profile-photo"
              type="file"
              accept=".png,.jpg,.jpeg"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          <div className="min-w-0 max-w-[280px] sm:max-w-sm">
            <h2 className="truncate text-[30px] font-semibold text-gray1" title={displayName}>
              {displayName}
            </h2>
            <p className="text-lg text-gray2">
              {(data?.role || "oem").replace("_", " ")} | {data?.email || "--"}
            </p>
          </div>
        </div>

        <div className="max-w-[260px]">
          <Button
            title="Edit Personal Info"
            iconLeft={<Pencil size={16} />}
            className="rounded-2xl"
            onClick={() => setEditing(true)}
          />
        </div>
      </section>

      <section className="rounded-[24px] border border-[#E8ECF4] bg-white p-5 shadow-sm">
        <div className="grid gap-8 md:grid-cols-3">
          {details.map((detail) => (
            <div
              key={detail.label}
              className={detail.label === "Address" ? "md:col-span-3" : ""}
            >
              <p className="text-sm text-gray3">{detail.label}</p>
              <p className="mt-2 text-lg text-gray2">{detail.value}</p>
            </div>
          ))}
        </div>
      </section>

      <RightSlider title="Edit Personal Information" open={editing} onClose={() => setEditing(false)}>
        <EditInfoForm onClose={() => setEditing(false)} />
      </RightSlider>
    </div>
  );
}
