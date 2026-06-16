import Link from "next/link";
import { ArrowRight, ReceiptText } from "lucide-react";

import {
  getOwnerForId,
  OwnerDetailShell,
} from "../../_components/owner-detail-shell";

interface PageProps {
  params: Promise<{ id: string }>;
}

const transactions = [
  ["Starter plan", "10-01-2026", "Jan 2026", "\u20A6150, 000", "Card transfer", "Success"],
  ["Starter plan", "10-01-2026", "Jan 2026", "\u20A6150, 000", "Card transfer", "Failed"],
  ["Starter plan", "10-01-2026", "Jan 2026", "\u20A6150, 000", "Card transfer", "Success"],
  ["Starter plan", "10-01-2026", "Jan 2026", "\u20A6150, 000", "Card transfer", "Success"],
];

export default async function AgentBusinessOwnerSubscriptionPage({ params }: PageProps) {
  const { id } = await params;
  const owner = getOwnerForId(id);

  return (
    <OwnerDetailShell ownerId={owner.id} activeTab="Subscription">
      <section className="space-y-4">
        <div className="rounded-xl border border-[#DDE0E5] bg-white p-4 md:p-5">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-[#111827]">
              Subscription Status
            </h2>
            <Link
              href={`/dashboard/agent/business-owners/${owner.id}/subscription/plans`}
              className="inline-flex items-center gap-2 text-sm font-medium text-[#017BED]"
            >
              View more plans <ArrowRight size={16} />
            </Link>
          </div>
          <p className="text-sm text-[#6B7280]">Current plan</p>
          <div className="mt-1 flex items-center gap-3">
            <p className="text-xl font-semibold text-[#111827]">Starter Plan</p>
            <span className="rounded bg-[#DCFCE7] px-2 py-1 text-xs text-[#13A83B]">
              Active
            </span>
          </div>
          <div className="mt-6 space-y-2 text-sm text-[#6B7280]">
            <p>Next billing date; February 15,2025</p>
            <p>Monthly cost: {"\u20A6"}150, 000</p>
            <p>Per annum cost: {"\u20A6"}150, 000</p>
          </div>
          <p className="mt-6 text-sm text-[#017BED]">
            Your commission (10%): {"\u20A6"}150, 000/month
          </p>
        </div>

        <div className="rounded-xl border border-[#EEF0F3] bg-white p-4 md:p-5">
          <h2 className="mb-5 text-lg font-semibold text-[#111827]">
            Transaction history
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-[#F3F4F6] text-left text-xs font-medium text-[#6B7280]">
                  <th className="py-3">Subscription type</th>
                  <th className="py-3">Renewal date</th>
                  <th className="py-3">Billing period</th>
                  <th className="py-3">Amount paid</th>
                  <th className="py-3">Payment method</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((row, index) => (
                  <tr key={index} className="border-b border-[#F3F4F6]">
                    {row.map((cell, cellIndex) => (
                      <td
                        key={`${cell}-${cellIndex}`}
                        className={`py-4 ${
                          cell === "Success"
                            ? "text-[#13A83B]"
                            : cell === "Failed"
                              ? "text-[#DC2626]"
                              : "text-[#111827]"
                        }`}
                      >
                        {cellIndex === 0 ? "1. " : ""}
                        {cell}
                      </td>
                    ))}
                    <td className="py-4">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 text-[#017BED]"
                      >
                        <ReceiptText size={16} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </OwnerDetailShell>
  );
}
