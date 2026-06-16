import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  FileText,
  MessageCircleMore,
} from "lucide-react";

import Header from "../../../../../component/header";
import { ProtectedRoute } from "@/components/dashboard/protected-routes";
import { UserRole } from "@/types/user";

interface PageProps {
  params: Promise<{ id: string; disputeId: string }>;
}

const disputeFacts = [
  { label: "Dispute ID", value: "1234356" },
  { label: "Order", value: "123456" },
  { label: "ID", value: "\u20A650,000" },
  { label: "Amount", value: "123456" },
  { label: "Item name", value: "ESCROW" },
  { label: "Payment type", value: "Distributor (Samuel Smart)" },
  { label: "Against", value: "27/11/2025" },
  { label: "Date created", value: "24-48 hours" },
];

const noteCards = [
  {
    accent: "bg-[#2F6BFF]",
    sender: "Sent by Me",
    attachment: true,
  },
  {
    accent: "bg-[#FFC000]",
    sender: "Sent by Admin",
    attachment: false,
  },
  {
    accent: "bg-[#22C55E]",
    sender: "Sent by Distributor",
    attachment: false,
  },
];

export default async function AgentBusinessOwnerDisputeDetailPage({
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
          href={`/dashboard/agent/business-owners/${id}/disputes`}
          className="inline-flex items-center gap-2 text-sm text-[#374151] hover:text-[#0669D9]"
        >
          <ArrowLeft size={16} />
          Go Back
        </Link>

        <section className="rounded-xl border border-[#DDE2EA] bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[18px] font-medium text-[#111827]">
                Reason for dispute
              </h1>
              <p className="mt-5 text-[16px] text-[#111827]">
                Item not delivered.
              </p>
            </div>

            <span className="inline-flex h-[54px] items-center gap-3 rounded-xl bg-[#1FAF38] px-5 text-[18px] font-medium text-white">
              <span className="flex size-5 items-center justify-center rounded bg-white text-[#1FAF38]">
                <Check size={14} strokeWidth={3} />
              </span>
              Resolved
            </span>
          </div>

          <div className="mt-10 max-w-[780px]">
            <h2 className="text-[18px] font-medium text-[#111827]">
              Description:
            </h2>
            <p className="mt-2 text-[14px] leading-10 text-[#111827]">
              Figma ipsum component variant main layer. Group flatten auto rotate
              link slice layer. Effect draft style invite flows union. Polygon
              object variant scrolling image main slice scale. Selection variant
              plugin frame undo style stroke create create. Italic union pen
              figjam component edit create flatten boolean flatten.
            </p>
          </div>

          <div className="mt-16 flex flex-wrap gap-y-6">
            {disputeFacts.map((fact, index) => (
              <div key={fact.label} className="flex items-start">
                <div
                  className={`min-w-0 ${
                    fact.label === "Payment type"
                      ? "w-[208px]"
                      : fact.label === "Date created"
                        ? "w-[126px]"
                        : "w-[92px]"
                  }`}
                >
                  <p className="text-[14px] text-[#6B7280]">{fact.label}</p>
                  <p className="mt-2 text-[16px] text-[#111827]">{fact.value}</p>
                </div>
                {index < disputeFacts.length - 1 ? (
                  <span className="mx-5 mt-1 hidden h-12 w-px bg-[#E5E7EB] xl:block" />
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-12">
            <h2 className="text-[18px] font-medium text-[#111827]">
              Evidence added
            </h2>

            <div className="mt-6 flex items-center gap-4">
              <span className="flex size-[48px] items-center justify-center rounded-2xl bg-[#DFFFF0] text-[#22C55E]">
                <FileText size={22} />
              </span>
              <span className="text-[16px] text-[#111827]">Attached document</span>
              <Link
                href="#"
                className="inline-flex items-center gap-2 text-[16px] text-[#FE6E00]"
              >
                <Eye size={16} />
                View
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-[#DDE2EA] bg-white p-5">
          <div className="flex items-center gap-3">
            <MessageCircleMore size={22} className="text-[#0D7CF2]" />
            <h2 className="text-[18px] font-medium text-[#111827]">
              Previous notes on dispute (3)
            </h2>
          </div>

          <div className="mt-6 space-y-3">
            {noteCards.map((note, index) => (
              <article
                key={note.sender}
                className="relative rounded-2xl border border-[#EEF1F5] bg-[#FBFCFD] px-5 py-4"
              >
                <div className="flex gap-4">
                  <span className={`mt-1 w-[3px] shrink-0 rounded-full ${note.accent}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] leading-8 text-[#111827]">
                      Figma ipsum component variant main layer. Outline arrange
                      main vector text. Figma follower auto resizing bold
                      selection opacity.
                    </p>

                    <div className="mt-6 flex items-center justify-between gap-4">
                      {note.attachment ? (
                        <div className="flex items-center gap-5">
                          <span className="inline-flex items-center gap-2 text-[14px] text-[#6B7280]">
                            <FileText size={16} className="text-[#22C55E]" />
                            Attachement.pdf
                          </span>
                          <Link
                            href="#"
                            className="inline-flex items-center gap-2 text-[16px] text-[#FE6E00]"
                          >
                            <Eye size={16} />
                            View
                          </Link>
                        </div>
                      ) : (
                        <span />
                      )}
                      <p className="text-[14px] text-[#4B5563]">{note.sender} 9:30am</p>
                    </div>
                  </div>
                </div>

                {index === 0 ? (
                  <span className="absolute right-[8px] top-[18px] h-[36px] w-[3px] rounded-full bg-[#2F6BFF]" />
                ) : null}
              </article>
            ))}
          </div>

          <Link
            href="#"
            className="mt-8 inline-flex items-center gap-3 text-[18px] text-[#0D7CF2]"
          >
            See resolution summary
            <ArrowRight size={18} />
          </Link>
        </section>
      </main>
    </ProtectedRoute>
  );
}
