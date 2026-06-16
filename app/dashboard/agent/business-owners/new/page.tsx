"use client";

import Link from "next/link";
import { CheckCircle2, UserPlus, XCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";

import Header from "../../../component/header";
import { ProtectedRoute } from "@/components/dashboard/protected-routes";
import { UserRole } from "@/types/user";

export default function AgentAddBusinessOwnerPage() {
  const searchParams = useSearchParams();
  const state = searchParams.get("state");

  return (
    <ProtectedRoute requiredRole={UserRole.AGENT}>
      {state === "success" ? (
        <StateOverlay
          tone="success"
          title="Business owner added"
          description="The business owner has been successfully added to your network."
          href="/dashboard/agent/business-owners"
        />
      ) : null}
      {state === "error" ? (
        <StateOverlay
          tone="error"
          title="Unable to add business owner"
          description="Check the submitted information and try again."
          href="/dashboard/agent/business-owners/new"
        />
      ) : null}

      <Header
        title="Business Owners"
        description="Wednesday 10th September, 2025"
      />
      <main className="min-h-[calc(100vh-100px)] bg-[#F5F7FA] p-3 md:p-6">
        <section className="mx-auto max-w-3xl rounded-xl border border-[#EEF0F3] bg-white p-4 md:p-6">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-[#EAF9FF]">
              <UserPlus size={22} className="text-[#0669D9]" />
            </span>
            <div>
              <h1 className="text-xl font-semibold text-[#111827]">
                Add Business Owner
              </h1>
              <p className="text-sm text-[#6B7280]">
                Enter business information to onboard a new owner.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Business name" placeholder="Enter business name" />
            <Field label="Business type" placeholder="Distributor" />
            <Field label="Email address" placeholder="Enter email address" />
            <Field label="Phone number" placeholder="Enter phone number" />
            <Field label="Address" placeholder="Enter address" wide />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/dashboard/agent/business-owners"
              className="inline-flex justify-center rounded-xl border border-[#DDE0E5] px-5 py-3 text-sm font-medium text-[#374151]"
            >
              Cancel
            </Link>
            <Link
              href="/dashboard/agent/business-owners/new?state=success"
              className="inline-flex justify-center rounded-xl bg-[#0669D9] px-5 py-3 text-sm font-medium text-white"
            >
              Add business owner
            </Link>
          </div>
        </section>
      </main>
    </ProtectedRoute>
  );
}

function Field({
  label,
  placeholder,
  wide,
}: {
  label: string;
  placeholder: string;
  wide?: boolean;
}) {
  return (
    <label className={wide ? "md:col-span-2" : ""}>
      <span className="mb-1 block text-xs text-[#6B7280]">{label}</span>
      <input
        type="text"
        placeholder={placeholder}
        className="w-full rounded-xl border border-[#DDE0E5] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0669D9]/30"
      />
    </label>
  );
}

function StateOverlay({
  tone,
  title,
  description,
  href,
}: {
  tone: "success" | "error";
  title: string;
  description: string;
  href: string;
}) {
  const isSuccess = tone === "success";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
        <span
          className={`mx-auto flex size-14 items-center justify-center rounded-full ${
            isSuccess ? "bg-[#DCFCE7]" : "bg-[#FEE2E2]"
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 size={30} className="text-[#13A83B]" />
          ) : (
            <XCircle size={30} className="text-[#DC2626]" />
          )}
        </span>
        <h2 className="mt-4 text-lg font-semibold text-[#111827]">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[#6B7280]">{description}</p>
        <Link
          href={href}
          className="mt-6 inline-flex w-full justify-center rounded-xl bg-[#0669D9] px-5 py-3 text-sm font-medium text-white"
        >
          Continue
        </Link>
      </div>
    </div>
  );
}
