import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckSquare, Circle } from "lucide-react";

import Header from "../../../../../component/header";
import { ProtectedRoute } from "@/components/dashboard/protected-routes";
import { UserRole } from "@/types/user";

interface PageProps {
  params: Promise<{ id: string }>;
}

const planCards = [
  {
    name: "Free Plan",
    price: "This is a free plan",
    note: "No fee is required",
    active: false,
  },
  {
    name: "Starter Plan",
    price: "\u20A675,000 / month",
    note: "\u20A6225,000 billed yearly",
    active: false,
  },
  {
    name: "Bronze Plan",
    price: "\u20A650,000 / month",
    note: "\u20A6150,000 billed yearly",
    active: true,
  },
  {
    name: "Silver Plan",
    price: "This is a free plan",
    note: "No fee is required",
    active: false,
  },
  {
    name: "Gold Plan",
    price: "\u20A675,000 / month",
    note: "\u20A6225,000 billed yearly",
    active: false,
  },
  {
    name: "Platinum Plan",
    price: "\u20A675,000 / month",
    note: "\u20A6225,000 billed yearly",
    active: false,
  },
];

export default async function AgentBusinessOwnerSubscriptionPlansPage({
  params,
}: PageProps) {
  const { id } = await params;

  return (
    <ProtectedRoute requiredRole={UserRole.AGENT}>
      <Header
        title="Business Owners"
        description="Wednesday 10th September, 2025"
      />
      <main className="min-h-[calc(100vh-100px)] space-y-5 bg-[#F5F7FA] p-5 md:p-6">
        <Link
          href={`/dashboard/agent/business-owners/${id}/subscription`}
          className="inline-flex items-center gap-2 text-sm text-[#374151] hover:text-[#0669D9]"
        >
          <ArrowLeft size={16} />
          Go Back
        </Link>

        <section className="rounded-xl border border-[#DDE2EA] bg-white p-5">
          <div className="grid gap-6 md:grid-cols-[170px_1px_1fr_1px_1fr] md:items-center">
            <div className="rounded-xl border border-[#B9DDFF] px-6 py-5">
              <p className="text-[16px] text-[#4B5563]">Current Plan</p>
              <p className="mt-2 text-[18px] font-medium text-[#111827]">Basic Plan</p>
            </div>
            <span className="hidden h-12 w-px bg-[#D8DDE5] md:block" />
            <Fact label="Fee" value={"\u20A625,000"} />
            <span className="hidden h-12 w-px bg-[#D8DDE5] md:block" />
            <Fact label="Renewal date" value="30th May 2025" />
          </div>
        </section>

        <section className="rounded-xl border border-[#DDE2EA] bg-white p-5">
          <h1 className="text-[18px] font-medium text-[#111827]">
            All available plans - 6
          </h1>

          <div className="mt-8 grid gap-4 xl:grid-cols-3">
            {planCards.map((plan) => (
              <article
                key={plan.name}
                className={`rounded-xl border p-5 ${
                  plan.active
                    ? "border-[#2F6BFF] bg-[#F8FCFF]"
                    : "border-[#E7EAEE] bg-white"
                }`}
              >
                <div className="flex items-center gap-4">
                  {plan.active ? (
                    <span className="flex size-5 items-center justify-center rounded-full bg-[#2F6BFF]">
                      <span className="size-3 rounded-full bg-white" />
                    </span>
                  ) : (
                    <Circle size={18} className="fill-white text-[#C9CED6]" />
                  )}
                  <h2 className="text-[16px] font-medium text-[#111827]">
                    {plan.name}
                  </h2>
                </div>

                <div className="mt-5 border-t border-[#EEF1F5] pt-5">
                  <p className="text-[16px] font-semibold text-[#111827]">{plan.price}</p>
                  <p className="mt-2 text-[14px] text-[#6B7280]">{plan.note}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-[#E7EAEE] p-5">
            <h2 className="text-[16px] font-medium text-[#111827]">Description</h2>
            <p className="mt-3 text-[14px] text-[#111827]">Limit (1-10)</p>

            <div className="mt-16 grid gap-6 xl:grid-cols-2">
              <div>
                <h3 className="text-[16px] font-medium text-[#111827]">Features</h3>
                <ul className="mt-8 space-y-6">
                  {["Bulk upload", "RFQ Priority"].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-[14px] text-[#6B7280]">
                      <span className="flex size-5 items-center justify-center rounded border border-[#97A0AF] text-[#6B7280]">
                        <CheckSquare size={12} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="xl:pl-28">
                <ul className="mt-14 space-y-6">
                  {["Bulk upload", "Highlights/featured"].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-[14px] text-[#6B7280]">
                      <span className="flex size-5 items-center justify-center rounded border border-[#97A0AF] text-[#6B7280]">
                        <CheckSquare size={12} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-[#E7EAEE] p-5">
            <Link
              href={`/dashboard/agent/business-owners/${id}/subscription/payment`}
              className="inline-flex h-[60px] items-center gap-3 rounded-xl bg-[#FE6E00] px-16 text-[18px] font-medium text-white"
            >
              Activate plan
              <ArrowRight size={20} />
            </Link>
          </div>
        </section>
      </main>
    </ProtectedRoute>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[16px] text-[#6B7280]">{label}</p>
      <p className="mt-2 text-[18px] font-medium text-[#111827]">{value}</p>
    </div>
  );
}
