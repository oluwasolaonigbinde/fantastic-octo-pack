"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckSquare,
  Edit3,
  Eye,
  FileText,
  MessageSquare,
} from "lucide-react";

import Header from "../../../../component/header";
import {
  findBuyerOrderDispute,
  getBuyerOrderDisputeStatusTone,
  type BuyerOrderDispute,
  type BuyerOrderDisputeNote,
} from "@/constants/demoBuyerOrderDisputes";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value || "--";
  return new Intl.DateTimeFormat("en-GB").format(parsed);
};

const noteAccent: Record<BuyerOrderDisputeNote["sentBy"], string> = {
  Me: "border-l-primary",
  Admin: "border-l-[#FACC15]",
  Distributor: "border-l-[#22C55E]",
};

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[#8A94A6]">{label}</p>
      <p className="mt-1 text-sm font-medium text-[#111827]">{value}</p>
    </div>
  );
}

function EvidenceBlock({ dispute }: { dispute: BuyerOrderDispute }) {
  return (
    <div className="mt-8">
      <h3 className="text-lg font-medium text-[#111827]">Evidence added</h3>
      <div className="mt-4 inline-flex items-center gap-4">
        <span className="inline-flex size-11 items-center justify-center rounded-lg bg-[#D9FBE7] text-[#16A34A]">
          <FileText size={19} />
        </span>
        <span className="text-sm text-[#111827]">{dispute.evidence.label}</span>
        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm text-[#FF6B00]"
        >
          <Eye size={14} />
          View
        </button>
      </div>
    </div>
  );
}

function NotesList({ notes }: { notes: BuyerOrderDisputeNote[] }) {
  return (
    <section className="rounded-2xl border border-[#DDE0E5] bg-white p-5">
      <h2 className="flex items-center gap-2 text-lg font-medium text-[#111827]">
        <MessageSquare size={18} className="text-primary" />
        Previous notes on dispute ({notes.length})
      </h2>
      <div className="mt-5 space-y-3">
        {notes.map((note) => (
          <article
            key={note.id}
            className={`rounded-xl border-l-4 ${noteAccent[note.sentBy]} bg-white px-3 py-4`}
          >
            <p className="text-sm leading-6 text-[#111827]">{note.text}</p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {note.attachment ? (
                  <>
                    <span className="inline-flex items-center gap-2 text-xs text-[#16A34A]">
                      <FileText size={13} />
                      {note.attachment}
                    </span>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs text-[#FF6B00]"
                    >
                      <Eye size={12} />
                      View
                    </button>
                  </>
                ) : null}
              </div>
              <p className="text-xs text-[#111827]">
                Sent by {note.sentBy} <span className="ml-4">{note.time}</span>
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function AddCommentPanel() {
  return (
    <section className="rounded-2xl border border-[#DDE0E5] bg-white p-5">
      <h2 className="flex items-center gap-2 text-lg font-medium text-[#111827]">
        <Edit3 size={18} className="text-primary" />
        Add comment (optional)
      </h2>
      <textarea
        placeholder="This will be any additional note from buyer"
        className="mt-4 min-h-[100px] w-full resize-none rounded-xl border border-[#DDE0E5] px-4 py-3 text-sm outline-none placeholder:text-[#C4C8CE]"
      />
      <label className="mt-4 flex h-[132px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#DDE0E5] text-sm text-[#FF6B00]">
        <FileText size={22} />
        Attach evidence
        <input type="file" className="sr-only" />
      </label>
      <button
        type="button"
        className="mt-5 h-[52px] w-full rounded-xl bg-primary text-sm font-medium text-white"
      >
        Submit
      </button>
    </section>
  );
}

export default function BuyerOrderDisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [showCommentPanel, setShowCommentPanel] = useState(false);
  const disputeId = params.disputeId as string;
  const dispute = useMemo(() => findBuyerOrderDispute(disputeId), [disputeId]);
  const tone = getBuyerOrderDisputeStatusTone(dispute.status);
  const adminResolution =
    dispute.status === "resolved" ? dispute.adminResolution : undefined;

  return (
    <div>
      <Header title="Disputes" description="View and track all disputes" />

      <main className="space-y-5 bg-[#F9FAFB] p-4 md:p-6">
        <button
          type="button"
          onClick={() => router.push("/dashboard/buyer/orders")}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#111827]"
        >
          <ArrowLeft size={17} />
          Go Back
        </button>

        <section className="rounded-2xl border border-primary bg-white p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-lg font-medium text-[#111827]">Reason for dispute</h1>
              <p className="mt-3 text-sm text-[#111827]">{dispute.reason}</p>
              <h2 className="mt-6 text-sm font-medium text-[#111827]">Description:</h2>
              <p className="mt-2 text-sm leading-6 text-[#111827]">{dispute.description}</p>
            </div>

            <div
              className={`flex min-h-[58px] items-center justify-between gap-5 rounded-xl border px-4 ${tone.badgeClassName}`}
            >
              <span className="text-sm text-[#111827]">Request Status</span>
              <span
                className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs md:text-sm ${tone.buttonClassName}`}
              >
                <CheckSquare size={14} />
                {tone.detailLabel}
              </span>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
            <DetailStat label="Dispute ID" value={dispute.id} />
            <DetailStat label="Order ID" value={dispute.orderId} />
            <DetailStat label="Amount" value={formatCurrency(dispute.amount)} />
            <DetailStat label="Item name" value={dispute.itemName} />
            <DetailStat label="Payment type" value={dispute.paymentType} />
            <DetailStat label="Against" value={`Distributor (${dispute.against})`} />
            <DetailStat label="Date created" value={formatDate(dispute.createdAt)} />
            <DetailStat label="Resolution time" value={dispute.resolutionTime} />
          </div>

          <EvidenceBlock dispute={dispute} />
        </section>

        <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
          <NotesList notes={dispute.notes} />
          {showCommentPanel || dispute.status === "ongoing" ? (
            <AddCommentPanel />
          ) : (
            <section className="rounded-2xl border border-[#DDE0E5] bg-white p-5">
              <h2 className="text-lg font-medium text-[#111827]">
                Admin resolution summary
              </h2>
              {adminResolution ? (
                <div className="mt-5 space-y-3 text-sm text-[#111827]">
                  <p>Refund amount: {formatCurrency(adminResolution.refundAmount)}</p>
                  <p>Refund by: {adminResolution.refundDeadline}</p>
                  <p>{adminResolution.note}</p>
                </div>
              ) : (
                <p className="mt-5 text-sm text-[#6B7280]">
                  This dispute request was rejected in this visual preview.
                </p>
              )}
              <button
                type="button"
                onClick={() => setShowCommentPanel(true)}
                className="mt-5 h-11 w-full rounded-xl border border-primary text-sm font-medium text-primary"
              >
                Add another note
              </button>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
