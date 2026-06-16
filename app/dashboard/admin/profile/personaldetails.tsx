"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Edit, X } from "lucide-react";

import { Button, Input, RightSlider } from "@/components/base";
import { DEFAULT_AVATAR_SRC } from "@/constants/avatar";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { updateUser } from "@/store/slices/auth-slice";

type AdminProfileForm = {
  name: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  role: string;
  address: string;
};

function formatDate(value?: string | Date | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function formatDisplayDate(value?: string | Date | null) {
  const formatted = formatDate(value);
  if (!formatted) return "Not provided";
  const [year, month, day] = formatted.split("-");
  return `${day}/${month}/${year}`;
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const firstName = parts.shift() ?? "";
  return { firstName, lastName: parts.join(" ") };
}

function DetailItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="min-w-0 space-y-0.5">
      <p className="text-sm leading-5 text-gray3">{label}</p>
      <p className="break-words text-base leading-6 text-gray1">
        {value || "Not provided"}
      </p>
    </div>
  );
}

export default function AdminPersonalDetails() {
  const dispatch = useAppDispatch();
  const { data: user, isLoading } = useAppSelector((state) => state.auth);
  const [editing, setEditing] = useState(false);

  const profile = useMemo<AdminProfileForm>(() => {
    const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

    return {
      name: name || "Super Admin",
      email: user?.email ?? "",
      phoneNumber: user?.phoneNumber ?? "",
      dateOfBirth: formatDate(user?.dateOfBirth),
      role: "Super Admin",
      address: user?.address ?? "",
    };
  }, [user]);

  const [form, setForm] = useState(profile);

  const submitProfile = async () => {
    if (!user?.tokens?.accessToken) return;
    const { firstName, lastName } = splitName(form.name);

    await dispatch(
      updateUser({
        token: user.tokens.accessToken,
        formData: {
          firstName,
          lastName,
          phoneNumber: form.phoneNumber,
          dateOfBirth: form.dateOfBirth,
          address: form.address,
        },
      })
    );
    setEditing(false);
  };

  return (
    <>
      <div className="space-y-4">
        <section className="rounded-[12px] border border-gray5 bg-white p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="size-[70px] shrink-0 overflow-hidden rounded-full bg-gray5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={user?.displayPhoto?.url || DEFAULT_AVATAR_SRC}
                  alt=""
                  className="size-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-medium leading-6 text-gray1">
                  {profile.name}
                </h2>
                <p className="text-sm leading-5 text-gray1">Super Admin |</p>
                <p className="text-sm leading-5 text-gray1">
                  {profile.email || "No email"}
                </p>
              </div>
            </div>
            <Button
              title="Edit Personal Info"
              iconLeft={<Edit size={20} />}
              className="h-14 w-full rounded-[12px] md:w-[250px]"
              type="button"
              onClick={() => {
                setForm(profile);
                setEditing(true);
              }}
            />
          </div>
        </section>

        <section className="min-h-[290px] rounded-[12px] border border-gray5 bg-white p-6 md:min-h-[408px]">
          <div className="space-y-7">
            <div className="grid gap-x-20 gap-y-6 md:grid-cols-2">
              <DetailItem label="Name" value={profile.name} />
              <DetailItem label="Email address" value={profile.email} />
            </div>
            <div className="grid gap-x-16 gap-y-6 md:grid-cols-3">
              <DetailItem label="Phone number" value={profile.phoneNumber} />
              <DetailItem
                label="Date of birth"
                value={formatDisplayDate(profile.dateOfBirth)}
              />
              <DetailItem label="Role" value={profile.role} />
            </div>
            <DetailItem label="Address" value={profile.address} />
          </div>
        </section>
      </div>

      <RightSlider
        title="Edit Personal Information"
        open={editing}
        onClose={() => setEditing(false)}
      >
        <button
          type="button"
          aria-label="Close edit personal information"
          onClick={() => setEditing(false)}
          className="absolute right-10 top-6 hidden text-gray1 md:block"
        >
          <X size={24} />
        </button>
        <form
          className="flex flex-col gap-10 pt-5"
          onSubmit={(event) => {
            event.preventDefault();
            void submitProfile();
          }}
        >
          <div className="space-y-6">
            <Input
              label="Name"
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              className="rounded-[14px]"
            />
            <Input
              label="Email address"
              value={form.email}
              disabled
              className="rounded-[14px]"
            />
            <Input
              label="Phone number"
              value={form.phoneNumber}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  phoneNumber: event.target.value,
                }))
              }
              className="rounded-[14px]"
            />
            <Input
              label="Date of birth"
              type="date"
              value={form.dateOfBirth}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  dateOfBirth: event.target.value,
                }))
              }
              className="rounded-[14px]"
            />
            <div className="flex w-full flex-col gap-[var(--control-label-gap)]">
              <label className="type-label font-medium text-gray2">Role</label>
              <div className="flex h-[60px] items-center justify-between rounded-[14px] border border-gray5 bg-white px-4 text-base leading-6 text-gray1">
                <span>{form.role}</span>
                <ChevronDown size={20} className="text-gray3" />
              </div>
            </div>
            <label className="flex flex-col gap-[var(--control-label-gap)]">
              <span className="type-label font-medium text-gray2">Address</span>
              <textarea
                value={form.address}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, address: event.target.value }))
                }
                className="min-h-[100px] rounded-[14px] border border-gray5 bg-white px-4 py-4 text-base leading-6 text-gray1 outline-none focus:border-ring"
              />
            </label>
          </div>
          <Button
            title="Update Personal Information"
            type="submit"
            isBusy={isLoading}
            className="h-[60px] rounded-[14px] text-lg"
          />
        </form>
      </RightSlider>
    </>
  );
}
