"use client";

import Link from "next/link";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/base";

const fields = [
  { label: "Name of subscription plan", placeholder: "Enter name of plan", type: "input" },
  { label: "Amount billed monthly", placeholder: "Enter amount", type: "input" },
  { label: "Amount billed annually", placeholder: "Enter amount", type: "input" },
  { label: "Duration for plan", placeholder: "Enter duration period for plan", type: "input" },
  { label: "Plan description", placeholder: "Enter text here...", type: "textarea" },
  { label: "Features", placeholder: "Enter feature of plan", type: "input" },
];

function PlanField({
  label,
  placeholder,
  type,
}: {
  label: string;
  placeholder: string;
  type: string;
}) {
  return (
    <label className="block">
      <span className="block text-base leading-6 text-gray1">{label}</span>
      <span
        className={`mt-3 flex w-full rounded-[14px] border border-gray5 px-4 py-4 text-base leading-6 text-gray4 ${
          type === "textarea" ? "h-[100px] items-start" : "h-[60px] items-center"
        }`}
      >
        {placeholder}
      </span>
    </label>
  );
}

export default function AdminCreateSubscriptionPlanPage() {
  return (
    <div className="fixed inset-y-0 right-0 z-[100] w-full max-w-[500px] overflow-hidden bg-white text-gray1 shadow-xl">
      <header className="flex h-[100px] items-end justify-between border-b border-gray5 px-10 pb-5 pt-10">
        <h1 className="text-2xl font-semibold leading-10">Add New subscription plan</h1>
        <Link
          href="/dashboard/admin/subscriptions/plans"
          aria-label="Close create subscription plan"
          className="flex size-6 items-center justify-center"
        >
          <X size={24} />
        </Link>
      </header>

      <main className="h-[calc(100vh-100px)] overflow-y-auto px-8 pb-10 pt-8 sm:px-[35px]">
        <div className="flex flex-col gap-10">
          <div className="flex w-full flex-col gap-6">
            <p className="w-full text-sm leading-5">
              Kindly provide all required information to successfully create a new
              subscription plan.
            </p>

            {fields.map((field) => (
              <PlanField key={field.label} {...field} />
            ))}

            <button
              type="button"
              className="inline-flex items-center gap-2 text-lg leading-8 text-primary"
            >
              <Plus size={24} />
              Add another feature
            </button>
          </div>

          <Button
            title="Create plan"
            className="h-[60px] w-full rounded-[14px] text-lg"
            type="button"
          />
        </div>
      </main>
    </div>
  );
}
