import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  Circle,
} from "lucide-react";

import Header from "../../../../../component/header";
import { ProtectedRoute } from "@/components/dashboard/protected-routes";
import { UserRole } from "@/types/user";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AgentBusinessOwnerSubscriptionPaymentPage({
  params,
}: PageProps) {
  const { id } = await params;

  return (
    <ProtectedRoute requiredRole={UserRole.AGENT}>
      <Header
        title="Business Owners"
        description="Wednesday 10th September, 2025"
      />
      <main className="min-h-[calc(100vh-100px)] space-y-4 bg-[#F5F7FA] p-5 md:p-6">
        <Link
          href={`/dashboard/agent/business-owners/${id}/subscription/plans`}
          className="inline-flex items-center gap-2 text-sm text-[#374151] hover:text-[#0669D9]"
        >
          <ArrowLeft size={16} />
          Go Back
        </Link>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_474px]">
          <section className="min-h-[1230px] rounded-xl border border-[#DDE2EA] bg-white p-5">
            <div>
              <h1 className="text-[18px] font-medium leading-none text-[#111827]">
                Payment
              </h1>
              <p className="mt-2 text-[14px] text-[#111827]">
                Select preferred payment method to proceed
              </p>
            </div>

            <div className="mt-8 space-y-5">
              <div className="rounded-xl border border-[#E5E7EB] px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Circle size={22} className="fill-[#D9D9D9] text-[#B8C0CC]" />
                    <span className="text-[16px] font-medium text-[#111827]">
                      Credit card
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[20px] font-semibold text-[#0A4A92]">
                      VISA
                    </span>
                    <span className="rounded-full bg-[#E11D48] px-2 py-0.5 text-xs font-medium text-white">
                      mc
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[#E5E7EB] bg-[#FBFBFB] px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="flex size-6 items-center justify-center rounded-full border-2 border-[#FE6E00]">
                      <span className="size-3 rounded-full bg-[#FE6E00]" />
                    </span>
                    <span className="text-[16px] font-medium text-[#111827]">
                      Bank transfer
                    </span>
                  </div>
                  <ChevronDown size={22} className="text-[#111827]" />
                </div>

                <p className="mt-5 max-w-[620px] text-[14px] leading-6 text-[#111827]">
                  Make payment into the account details below and click on the
                  {" "}
                  &quot;i have made payment&quot; button below.
                </p>

                <div className="mt-6 border-t border-[#E5E7EB] pt-5">
                  <div className="space-y-3 text-[14px] text-[#111827]">
                    <p>Account number: 7694873992</p>
                    <p>Account name: Samuel Smart</p>
                    <p>Bank name: GTB bank</p>
                  </div>
                </div>

                <div className="mt-5 border-t border-[#E5E7EB] pt-4">
                  <p className="text-[14px] text-[#111827]">
                    <span className="text-[18px] leading-none">05:49</span>
                    {" "}
                    <span>(Make payment before time expires)</span>
                  </p>
                </div>

                <button
                  type="button"
                  className="mt-6 flex h-[60px] w-full items-center justify-center rounded-xl bg-[#77A9E4] text-[16px] font-medium text-white"
                >
                  I have made payment
                </button>
              </div>

              <div className="rounded-xl border border-[#E5E7EB] bg-[#FBFBFB] px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Circle size={22} className="fill-[#D9D9D9] text-[#B8C0CC]" />
                    <span className="text-[16px] font-medium text-[#111827]">
                      My wallet
                    </span>
                  </div>
                  <ChevronDown size={22} className="text-[#111827]" />
                </div>

                <p className="mt-5 text-[14px] leading-6 text-[#111827]">
                  You can use your available wallet to make payment.
                </p>

                <div className="mt-8">
                  <p className="text-[14px] text-[#111827]">Available wallet balance</p>
                  <p className="mt-4 text-[24px] font-medium leading-none text-[#111827]">
                    {"\u20A6"}150, 000
                  </p>
                </div>

                <button
                  type="button"
                  className="mt-8 flex h-[60px] w-full items-center justify-center rounded-xl bg-[#77A9E4] text-[16px] font-medium text-white"
                >
                  Make payment
                </button>
              </div>
            </div>
          </section>

          <aside className="min-h-[1230px] rounded-xl border border-[#DDE2EA] bg-white px-5 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[14px] text-[#111827]">Your bronze plan</p>
                <p className="mt-1 text-[20px] font-medium leading-none text-[#111827]">
                  Bronze plan
                </p>
              </div>
              <div className="flex items-center gap-2 pt-1 text-[14px] text-[#111827]">
                <span>Monthly</span>
                <span className="flex h-4 w-7 items-center rounded-full bg-[#0669D9] px-0.5">
                  <span className="ml-auto size-3 rounded-full bg-white" />
                </span>
                <span className="text-[#0669D9]">Yearly</span>
              </div>
            </div>

            <div className="mt-16 space-y-5 text-[14px] text-[#111827]">
              <SummaryRow
                label="Any addition to the plan"
                value={"\u20A6340,000"}
              />
              <SummaryRow
                label="Any addition to the plan"
                value={"\u20A6340,000"}
              />
            </div>

            <div className="mt-8 border-t border-[#E5E7EB] pt-6">
              <div className="flex items-center justify-between gap-4 text-[18px] font-medium">
                <span className="text-[#111827]">Total</span>
                <span className="text-[#0669D9]">{"\u20A6350,000"}</span>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </ProtectedRoute>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
