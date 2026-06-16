"use client";

import { CheckCircle2 } from "lucide-react";

import Header from "../../component/header";
import { ProtectedRoute } from "@/components/dashboard/protected-routes";
import { UserRole } from "@/types/user";

const PLAN_FEATURES = [
  "Listed on the Service Engineer directory",
  "Standard job request notifications",
  "Email support",
];

/**
 * Non-functional UI shell — plan and billing actions are disabled until subscription is implemented.
 */
export default function EngineerSubscription() {
  return (
    <ProtectedRoute requiredRole={UserRole.ENGINEER}>
      <div>
        <Header title="Subscription" description="Manage your subscription plan" />

        <div className="min-h-[calc(100vh-100px)] bg-[#F5F7FA] p-4 md:p-6">
          <p className="mb-4 rounded-xl border border-[#E6ECF2] bg-[#F0F7FF] px-4 py-3 text-sm text-[#4B5563]">
            Preview plan layout only — checkout and billing are not connected yet.
          </p>

          <div className="mx-auto max-w-2xl">
            <article className="overflow-hidden rounded-[24px] border border-[#E6ECF2] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
              <div className="border-b border-[#EEF2F8] bg-white px-6 py-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#EAF3FF] px-3 py-1 text-xs font-medium text-primary">
                    Current plan
                  </span>
                  <span className="rounded-full bg-[#FFF4E8] px-3 py-1 text-xs font-medium text-[#D97627]">
                    Preview
                  </span>
                </div>
                <h2 className="mt-4 text-2xl font-semibold text-[#111827]">Engineer Standard</h2>
                <p className="mt-1 text-sm text-[#6B7280]">{/* Figma-style subtitle */}Monthly billing · renews when available</p>
                <p className="mt-1 text-2xl font-semibold text-[#111827]">
                  ₦0 <span className="text-base font-normal text-[#6B7280]">/ month (placeholder)</span>
                </p>
              </div>

              <div className="space-y-4 px-6 py-6">
                <p className="text-sm font-medium text-[#111827]">What&apos;s included</p>
                <ul className="space-y-3">
                  {PLAN_FEATURES.map((line) => (
                    <li key={line} className="flex items-start gap-3 text-sm text-[#4B5563]">
                      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#34A853]" aria-hidden />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-[#EEF2F8] bg-[#FAFBFC] px-6 py-5">
                <button
                  type="button"
                  disabled
                  className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white opacity-50 cursor-not-allowed"
                >
                  Upgrade plan
                </button>
                <p className="mt-3 text-center text-xs text-[#9CA3AF]">
                  Payment and plan changes will be enabled when subscription goes live.
                </p>
              </div>
            </article>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
