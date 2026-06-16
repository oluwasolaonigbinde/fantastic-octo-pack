"use client";

import Link from "next/link";
import { ChevronDown, X } from "lucide-react";

import { Button } from "@/components/base";

const fields = [
  { label: "Full name", placeholder: "Enter full name", select: false },
  { label: "Email address", placeholder: "Enter user's email address", select: false },
  { label: "Phone number", placeholder: "Enter phone number", select: false },
  { label: "Status", placeholder: "Select status", select: true },
  { label: "Role", placeholder: "Select role", select: true },
];

function UserField({
  label,
  placeholder,
  select,
}: {
  label: string;
  placeholder: string;
  select: boolean;
}) {
  return (
    <label className="block w-full">
      <span className="block px-4 text-base leading-6 text-gray1">{label}</span>
      <span className="mt-1 flex h-[60px] w-full items-center rounded-[14px] border border-gray5 px-4 py-4 text-base leading-6 text-gray4">
        <span className="min-w-0 flex-1">{placeholder}</span>
        {select ? <ChevronDown size={24} className="text-gray3" /> : null}
      </span>
    </label>
  );
}

export default function AdminAddUserPage() {
  return (
    <div className="fixed inset-y-0 right-0 z-[100] w-full max-w-[500px] overflow-hidden bg-white text-gray1 shadow-xl">
      <main className="h-[750px] w-[420px] px-10 pt-10">
        <div className="flex h-8 w-full items-center justify-between">
          <h1 className="text-xl font-semibold leading-8 text-black">Add a New User</h1>
          <Link
            href="/dashboard/admin/user-management"
            aria-label="Close add user"
            className="flex size-6 items-center justify-center"
          >
            <X size={24} />
          </Link>
        </div>

        <div className="mt-6 flex flex-col gap-8">
          <p className="whitespace-nowrap text-sm leading-5 text-black">
            Kindly enter all correct information to successfully create a new user
          </p>

          <div className="flex flex-col gap-6">
            {fields.map((field) => (
              <UserField key={field.label} {...field} />
            ))}
          </div>

          <Button
            title="Proceed To Create This User"
            className="h-[60px] w-full rounded-[14px] text-lg"
            type="button"
          />
        </div>
      </main>
    </div>
  );
}
