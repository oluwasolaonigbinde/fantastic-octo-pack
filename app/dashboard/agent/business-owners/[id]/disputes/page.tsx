import Link from "next/link";
import { Eye, SlidersHorizontal } from "lucide-react";

import {
  getOwnerForId,
  OwnerDetailShell,
} from "../../_components/owner-detail-shell";

interface PageProps {
  params: Promise<{ id: string }>;
}

const disputes = Array.from({ length: 8 }, (_, index) => ({
  id: index === 0 ? "DISP-001" : `DISP-00${index + 1}`,
  orderId: "The order ID",
  raisedBy: "Buyer",
  against: "Distributor",
  status: "Under review",
  date: "25/11/2025",
}));

export default async function AgentBusinessOwnerDisputesPage({ params }: PageProps) {
  const { id } = await params;
  const owner = getOwnerForId(id);

  return (
    <OwnerDetailShell ownerId={owner.id} activeTab="Disputes">
      <section className="rounded-xl border border-[#DDE0E5] bg-white p-5">
        <h2 className="text-[18px] font-medium text-[#111827]">All Disputes</h2>

        <div className="mt-10">
          <p className="mb-4 text-xs font-medium text-[#374151]">
            Filter table list by:
          </p>
          <div className="grid gap-3 md:grid-cols-[182px_182px_250px] md:gap-5">
            <label>
              <span className="mb-1 block text-xs text-[#6B7280]">
                Disputes status
              </span>
              <input
                type="text"
                placeholder="Select status"
                className="h-[60px] w-full rounded-[14px] border border-[#DDE0E5] px-4 text-sm outline-none"
              />
            </label>
            <label>
              <span className="mb-1 block text-xs text-[#6B7280]">Date</span>
              <input
                type="text"
                placeholder="DD/MM/YY"
                className="h-[60px] w-full rounded-[14px] border border-[#DDE0E5] px-4 text-sm outline-none"
              />
            </label>
            <button
              type="button"
              className="mt-5 inline-flex h-[60px] w-full items-center justify-center gap-3 rounded-[14px] bg-[#0669D9] px-6 text-[18px] font-medium text-white"
            >
              <SlidersHorizontal size={16} />
              Filter
            </button>
          </div>
        </div>

        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-[#F3F4F6] text-left text-xs font-medium text-[#6B7280]">
                <th className="py-3">Dispute ID</th>
                <th className="py-3">Order ID</th>
                <th className="py-3">Raised by</th>
                <th className="py-3">Against</th>
                <th className="py-3">Status</th>
                <th className="py-3">Date raised</th>
                <th className="py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {disputes.map((dispute) => (
                <tr key={dispute.id} className="border-b border-[#F3F4F6]">
                  <td className="py-4 text-[#111827]">The dispute ID</td>
                  <td className="py-4 text-[#111827]">{dispute.orderId}</td>
                  <td className="py-4 text-[#111827]">{dispute.raisedBy}</td>
                  <td className="py-4 text-[#111827]">{dispute.against}</td>
                  <td className="py-4 text-[#FE6E00]">{dispute.status}</td>
                  <td className="py-4 text-[#111827]">{dispute.date}</td>
                  <td className="py-4">
                    <Link
                      href={`/dashboard/agent/business-owners/${owner.id}/disputes/${dispute.id}`}
                      className="inline-flex items-center gap-2 text-[#017BED]"
                    >
                      <Eye size={16} />
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </OwnerDetailShell>
  );
}
