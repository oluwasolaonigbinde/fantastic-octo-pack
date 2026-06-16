import { Users } from "lucide-react";

import {
  getOwnerForId,
  OwnerDetailShell,
} from "../../_components/owner-detail-shell";

interface PageProps {
  params: Promise<{ id: string }>;
}

const escrowSummary = [
  {
    label: "Total in ESCROW",
    value: "\u20A6150, 000",
    tone: "border-[#2F6BFF] bg-[#EAF9FF] text-[#111827]",
    icon: "text-[#2F6BFF]",
  },
  {
    label: "Pending release",
    value: "3 orders",
    tone: "border-[#FE6E00] bg-[#FFF7F0] text-[#111827]",
    icon: "text-[#FE6E00]",
  },
  {
    label: "Eligible commissionn",
    value: "\u20A6150, 000",
    tone: "border-[#22C55E] bg-[#DFFFF0] text-[#111827]",
    icon: "text-[#22C55E]",
  },
];

const escrowRows = [
  ["ORD - 001", "\u20A6150,000", "\u20A6150,000", "2 days", "02 - 01 - 2026", "ESCROW releassed"],
  ["ORD - 001", "\u20A6150,000", "\u20A6150,000", "2 days", "02 - 01 - 2026", "In delivery"],
  ["ORD - 001", "\u20A6150,000", "\u20A6150,000", "2 days", "02 - 01 - 2026", "ESCROW releassed"],
  ["ORD - 001", "\u20A6150,000", "\u20A6150,000", "2 days", "02 - 01 - 2026", "ESCROW releassed"],
  ["ORD - 001", "\u20A6150,000", "\u20A6150,000", "2 days", "02 - 01 - 2026", "ESCROW releassed"],
];

export default async function AgentBusinessOwnerEscrowPage({ params }: PageProps) {
  const { id } = await params;
  const owner = getOwnerForId(id);

  return (
    <OwnerDetailShell ownerId={owner.id} activeTab="ESCROW">
      <section className="rounded-xl border border-[#DDE2EA] bg-white p-5">
        <h2 className="text-[18px] font-medium text-[#111827]">
          ESCROW Management
        </h2>

        <div className="mt-8 grid gap-4 xl:grid-cols-3">
          {escrowSummary.map((card) => (
            <article
              key={card.label}
              className={`rounded-3xl border px-5 py-5 ${card.tone}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[14px]">{card.label}</p>
                  <p className="mt-3 text-[18px] font-medium">{card.value}</p>
                </div>
                <Users size={22} className={card.icon} />
              </div>
            </article>
          ))}
        </div>

        <div className="mt-16">
          <h3 className="text-[18px] font-medium text-[#111827]">
            Orders in ESCROW
          </h3>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead>
                <tr className="text-[14px] text-[#6B7280]">
                  <th className="pb-6 font-normal">Order ID</th>
                  <th className="pb-6 font-normal">ESCROW amount</th>
                  <th className="pb-6 font-normal">Eligible commission</th>
                  <th className="pb-6 font-normal">ESCROW timeline</th>
                  <th className="pb-6 font-normal">Expected release</th>
                  <th className="pb-6 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {escrowRows.map((row, index) => (
                  <tr key={`${row[0]}-${index}`} className="border-t border-[#EEF1F5]">
                    <td className="py-7 text-[14px] text-[#111827]">{row[0]}</td>
                    <td className="py-7 text-[14px] text-[#111827]">{row[1]}</td>
                    <td className="py-7 text-[14px] text-[#111827]">{row[2]}</td>
                    <td className="py-7 text-[14px] text-[#111827]">{row[3]}</td>
                    <td className="py-7 text-[14px] text-[#111827]">{row[4]}</td>
                    <td
                      className={`py-7 text-[14px] ${
                        row[5] === "In delivery" ? "text-[#FE6E00]" : "text-[#22C55E]"
                      }`}
                    >
                      {row[5]}
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
