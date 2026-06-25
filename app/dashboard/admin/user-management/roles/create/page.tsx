"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronDown, X } from "lucide-react";

import Header from "../../../../component/header";
import { Button } from "@/components/base";

function Stepper() {
  const steps = [
    { n: 1, label: "Basic Info", active: true },
    { n: 2, label: "Set Permission", active: false },
    { n: 3, label: "Review Details", active: false },
  ];

  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => (
        <div key={step.n} className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`flex size-[38px] items-center justify-center rounded-full border text-base ${
                step.active
                  ? "border-[#FE6E00] text-gray1"
                  : "border-dashed border-gray5 text-gray3"
              }`}
            >
              {step.n}
            </span>
            <span className={`text-base ${step.active ? "text-[#FE6E00]" : "text-gray3"}`}>
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 ? <span className="block w-[104px] border-t border-dashed border-gray5" /> : null}
        </div>
      ))}
    </div>
  );
}

function Field({
  label,
  placeholder,
  select = false,
  textarea = false,
}: {
  label: string;
  placeholder: string;
  select?: boolean;
  textarea?: boolean;
}) {
  return (
    <label className="block w-full">
      <span className="block px-4 text-base leading-6 text-gray1">{label}</span>
      <span
        className={`mt-1 flex w-full rounded-[14px] border border-gray5 px-4 py-4 text-base leading-6 text-gray4 ${
          textarea ? "h-[144px] items-start" : "h-[60px] items-center"
        }`}
      >
        <span className="min-w-0 flex-1">{placeholder}</span>
        {select && !textarea ? <ChevronDown size={24} className="text-gray3" /> : null}
      </span>
    </label>
  );
}

function UserPill({ name, initials }: { name: string; initials: string }) {
  return (
    <span className="inline-flex items-center gap-4 rounded-[30px] bg-[#FFF7F0] px-4 py-2.5">
      <span className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-full bg-[#F6D7C2] text-xs font-semibold text-[#8A3D16]">
          {initials}
        </span>
        <span className="text-sm leading-5 text-gray1">{name}</span>
      </span>
      <X size={24} />
    </span>
  );
}

export default function AdminCreateRolePage() {
  return (
    <div>
      <Header
        title="User Management"
        description="View and create users, roles, and privileges."
      />

      <main className="px-4 py-4">
        <Link
          href="/dashboard/admin/user-management"
          className="inline-flex items-center gap-2 text-lg leading-8 text-primary"
        >
          <ArrowLeft size={24} />
          Go Back
        </Link>

        <section className="mt-4 rounded-2xl border border-gray5 bg-white p-5">
          <h1 className="text-xl font-semibold leading-8 text-gray1">Create A New Role</h1>
          <p className="text-sm leading-5 text-gray1">Follow these 3 simple steps to create a new role.</p>
        </section>

        <section className="mt-4 rounded-2xl border border-gray5 bg-white p-10">
          <Stepper />

          <div className="mt-12 max-w-[999px] space-y-12">
            <div>
              <h2 className="text-lg font-medium leading-6 text-gray1">Basic Details</h2>
              <p className="text-sm leading-5 text-gray1">
                Add basic information about this role you are creating.
              </p>
            </div>

            <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:gap-[94px]">
              <div className="flex w-full max-w-[432px] flex-col gap-6">
                <Field label="Role name" placeholder="Enter role name" />
                <Field label="Role description" placeholder="Enter description here..." textarea />
              </div>

              <div className="flex w-full max-w-[473px] flex-col gap-6">
                <div>
                  <h2 className="text-lg font-medium leading-6 text-gray1">
                    Assign this role <span className="font-normal">(optional)</span>
                  </h2>
                  <p className="text-sm leading-5 text-gray1">
                    Select one or multiple users to assign to this role
                  </p>
                </div>
                <div className="space-y-2">
                  <Field label="Enter a user" placeholder="Select user" select />
                  <div className="h-[110px] rounded-2xl border border-gray5 p-6">
                    <div className="flex flex-wrap items-center gap-4">
                      <UserPill name="Ibrahim Zainab" initials="IZ" />
                      <UserPill name="Abang Okon" initials="AO" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-5">
              <Button
                title="Cancel"
                variant="primaryLight"
                iconLeft={<X size={18} />}
                className="h-14 w-[218px] rounded-lg bg-[#EAF8FF]"
                type="button"
              />
              <Button
                title="Proceed"
                iconRight={<ArrowRight size={18} />}
                className="h-14 w-[218px] rounded-lg"
                type="button"
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
