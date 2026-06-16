import { Download, PackageCheck } from "lucide-react";

import {
  getOwnerForId,
  OwnerDetailShell,
} from "../../../_components/owner-detail-shell";

interface PageProps {
  params: Promise<{ id: string; orderId: string }>;
}

const detailRows = [
  ["Order ID", "Order ID"],
  ["Name of product", "Product name"],
  ["Quantity", "5"],
  ["Unit price", "\u20A635,000"],
  ["Total price", "\u20A6175,000"],
  ["Commission", "\u20A615,000"],
];

export default async function AgentBusinessOwnerOrderDetailPage({ params }: PageProps) {
  const { id, orderId } = await params;
  const owner = getOwnerForId(id);

  return (
    <OwnerDetailShell ownerId={owner.id} activeTab="Orders">
      <section className="space-y-4">
        <div className="rounded-xl border border-[#EEF0F3] bg-white p-4 md:p-5">
          <div className="flex flex-wrap gap-5">
            <div className="flex size-32 items-center justify-center rounded-xl bg-[#F3F4F6]">
              <PackageCheck size={42} className="text-[#9CA3AF]" />
            </div>
            <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {detailRows.map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-[#6B7280]">{label}</p>
                  <p className="text-sm font-medium text-[#111827]">{value}</p>
                </div>
              ))}
            </div>
            <span className="h-fit rounded-lg bg-[#FFF7F0] px-4 py-2 text-sm font-medium text-[#FE6E00]">
              Awaiting payment
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-8 border-t border-[#F3F4F6] pt-4">
            <div>
              <p className="text-xs text-[#6B7280]">Payment method</p>
              <p className="text-sm font-medium text-[#111827]">ESCROW</p>
            </div>
            <div>
              <p className="text-xs text-[#6B7280]">Date created</p>
              <p className="text-sm font-medium text-[#111827]">25/09/2025</p>
            </div>
            <div>
              <p className="text-xs text-[#6B7280]">ESCROW Status</p>
              <p className="text-sm font-medium text-[#8E4106]">In ESCROW</p>
            </div>
            <div>
              <p className="text-xs text-[#6B7280]">Reference</p>
              <p className="text-sm font-medium text-[#111827]">{orderId}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-[#EEF0F3] bg-white p-4 md:p-5">
            <h2 className="mb-4 text-base font-semibold text-[#111827]">
              Payment Information
            </h2>
            <p className="text-xs text-[#6B7280]">Payment Method</p>
            <p className="mb-3 text-sm text-[#374151]">Bank transfer</p>
            <p className="text-xs text-[#6B7280]">Documents</p>
            <button
              type="button"
              className="mt-1 inline-flex items-center gap-2 text-sm text-[#374151]"
            >
              Invoice.pdf <Download size={16} className="text-[#FE6E00]" />
            </button>
            <p className="mt-4 text-xs text-[#6B7280]">Payment Details</p>
            <p className="text-sm text-[#374151]">Items total: {"\u20A6"}175,000</p>
            <p className="text-sm text-[#374151]">Delivery fee: {"\u20A6"}1,000</p>
          </div>

          <div className="rounded-xl border border-[#EEF0F3] bg-white p-4 md:p-5">
            <h2 className="mb-4 text-base font-semibold text-[#111827]">
              Delivery Address
            </h2>
            <p className="text-sm leading-6 text-[#374151]">
              Lorem ipsum dolor sit amet consectetur. Cras arcu sit massa consequat
              mi quis purus.
            </p>
          </div>

          <div className="rounded-xl border border-[#EEF0F3] bg-white p-4 md:p-5">
            <h2 className="mb-4 text-base font-semibold text-[#111827]">
              Supplier Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                ["Full name", "Samuel Smart"],
                ["Role", "Supplier"],
                ["Phone number", "00987899977"],
                ["Email address", "Bank transfer"],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-[#6B7280]">{label}</p>
                  <p className="text-sm text-[#374151]">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </OwnerDetailShell>
  );
}
