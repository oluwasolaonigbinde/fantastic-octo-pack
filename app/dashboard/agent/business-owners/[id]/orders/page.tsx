import Link from "next/link";
import { Eye } from "lucide-react";

import {
  getOwnerForId,
  OwnerDetailShell,
} from "../../_components/owner-detail-shell";

interface PageProps {
  params: Promise<{ id: string }>;
}

const ownerOrders = [
  ["ORD - 001", "\u20A6300,000", "The name of the product", "10", "24/09/2025", "Awaiting payment"],
  ["ORD - 001", "\u20A6300,000", "The name of the product", "10", "24/09/2025", "Awaiting payment"],
  ["ORD - 001", "\u20A6300,000", "The name of the product", "10", "24/09/2025", "Delivered"],
  ["ORD - 001", "\u20A6300,000", "The name of the product", "10", "24/09/2025", "In ESCROW"],
  ["ORD - 001", "\u20A6300,000", "The name of the product", "10", "24/09/2025", "Awaiting payment"],
  ["ORD - 001", "\u20A6300,000", "The name of the product", "10", "24/09/2025", "Awaiting payment"],
];

function statusClass(status: string) {
  if (status === "Delivered") return "text-[#13A83B]";
  if (status === "In ESCROW") return "text-[#8E4106]";
  return "text-[#FE6E00]";
}

export default async function AgentBusinessOwnerOrdersPage({ params }: PageProps) {
  const { id } = await params;
  const owner = getOwnerForId(id);

  return (
    <OwnerDetailShell ownerId={owner.id} activeTab="Orders">
      <section className="rounded-xl border border-[#EEF0F3] bg-white p-4 md:p-5">
        <h2 className="text-lg font-semibold text-[#111827]">
          Orders from this Business
        </h2>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-[#F3F4F6] text-left text-xs font-medium text-[#6B7280]">
                <th className="py-3">Order ID</th>
                <th className="py-3">Commission</th>
                <th className="py-3">Name of product</th>
                <th className="py-3">Quantity</th>
                <th className="py-3">Date</th>
                <th className="py-3">Status</th>
                <th className="py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {ownerOrders.map(([orderId, commission, product, quantity, date, status], index) => (
                <tr key={`${orderId}-${index}`} className="border-b border-[#F3F4F6]">
                  <td className="py-4 text-[#111827]">1. {orderId}</td>
                  <td className="py-4 text-[#111827]">{commission}</td>
                  <td className="py-4 text-[#111827]">{product}</td>
                  <td className="py-4 text-[#111827]">{quantity}</td>
                  <td className="py-4 text-[#111827]">{date}</td>
                  <td className={`py-4 ${statusClass(status)}`}>{status}</td>
                  <td className="py-4">
                    <Link
                      href={`/dashboard/agent/business-owners/${owner.id}/orders/ORDER-0010`}
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
