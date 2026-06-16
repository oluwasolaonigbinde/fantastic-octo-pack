"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, Info, MessageSquare, Plus, Eye } from "lucide-react";

import Header from "../../../../../component/header";
import {
  distributorDemoDisputes,
  getDisputeStatusTone,
} from "@/constants/demoDistributorOrders";

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

const accentClass = {
  blue: "border-l-primary",
  yellow: "border-l-[#FACC15]",
  green: "border-l-[#22C55E]",
};

export default function DistributorDisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [notice, setNotice] = useState("");

  const orderId = params.orderId as string;
  const disputeId = params.disputeId as string;

  const dispute = useMemo(() => {
    return (
      distributorDemoDisputes.find((item) => item.id === disputeId) || {
        id: disputeId,
        orderId,
        status: "unknown",
        reason: "Dispute detail",
        createdAt: new Date().toISOString(),
        amount: 0,
        itemName: "Item name",
        against: "Distributor",
        description:
          "This is a frontend-only dispute placeholder. Backend order dispute persistence is not available in this slice.",
        resolutionTime: "24-48 hours",
        evidence: {
          label: "Attached document",
          fileName: "Attachment.pdf",
        },
        notes: [],
      }
    );
  }, [disputeId, orderId]);

  const statusTone = getDisputeStatusTone(dispute.status);

  return (
    <div>
      <Header
        title="Orders & Disputes"
        description="View all quote request from customers"
      />

      <main className="space-y-5 p-4 md:p-6">
        <button
          type="button"
          onClick={() => router.push("/dashboard/distributor/orders")}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#111827]"
        >
          <ArrowLeft size={17} />
          Go Back
        </button>

        <section className="rounded-2xl border border-[#DDE0E5] bg-white p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-medium text-[#111827]">
                Reason for dispute
              </h2>
              <p className="mt-5 text-sm text-[#111827]">{dispute.reason}</p>

              <h3 className="mt-8 text-lg font-medium text-[#111827]">Description</h3>
              <p className="mt-3 max-w-5xl text-sm leading-6 text-[#111827]">
                {dispute.description}
              </p>
            </div>

            <div className="inline-flex h-16 items-center gap-5 rounded-xl border border-[#FF6B00] bg-[#FFF8F2] px-4">
              <span className="text-sm text-[#111827]">Request Status</span>
              <button
                type="button"
                onClick={() =>
                  setNotice(
                    "Requesting more information is demo-only here. No dispute status changed.",
                  )
                }
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#FF6B00] px-3 text-sm text-white"
              >
                <Plus size={14} />
                More information needed
              </button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
            <div>
              <p className="text-xs text-[#8A94A6]">Dispute ID</p>
              <p className="mt-1 text-sm font-medium text-[#111827]">{dispute.id}</p>
            </div>
            <div>
              <p className="text-xs text-[#8A94A6]">Order ID</p>
              <p className="mt-1 text-sm font-medium text-[#111827]">
                {dispute.orderId}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#8A94A6]">Amount</p>
              <p className="mt-1 text-sm font-medium text-[#111827]">
                {formatCurrency(dispute.amount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#8A94A6]">Item name</p>
              <p className="mt-1 text-sm font-medium text-[#111827]">
                {dispute.itemName}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#8A94A6]">Payment type</p>
              <p className="mt-1 text-sm font-medium text-[#111827]">ESCROW</p>
            </div>
            <div>
              <p className="text-xs text-[#8A94A6]">Against</p>
              <p className="mt-1 text-sm font-medium text-[#111827]">
                {dispute.against}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#8A94A6]">Date created</p>
              <p className="mt-1 text-sm font-medium text-[#111827]">
                {formatDate(dispute.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#8A94A6]">Resolution time</p>
              <p className="mt-1 text-sm font-medium text-[#111827]">
                {dispute.resolutionTime}
              </p>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-medium text-[#111827]">Evidence added</h3>
            <div className="mt-4 inline-flex items-center gap-4 rounded-xl bg-white">
              <span className="inline-flex size-11 items-center justify-center rounded-lg bg-[#D9FBE7] text-[#16A34A]">
                <FileText size={19} />
              </span>
              <span className="text-sm text-[#111827]">{dispute.evidence.label}</span>
              <button
                type="button"
                onClick={() =>
                  setNotice(
                    "Evidence preview is frontend-only until order dispute evidence exists.",
                  )
                }
                className="inline-flex items-center gap-2 text-sm text-[#FF6B00]"
              >
                <Eye size={14} />
                View
              </button>
            </div>
          </div>
        </section>

        {notice ? (
          <p className="rounded-xl border border-[#DDEBFF] bg-[#F4F9FF] px-4 py-3 text-sm text-primary">
            {notice}
          </p>
        ) : null}

        <section className="rounded-2xl border border-[#DDE0E5] bg-white p-5">
          <h2 className="flex items-center gap-2 text-lg font-medium text-[#111827]">
            <MessageSquare size={18} className="text-primary" />
            Previous notes on dispute ({dispute.notes.length})
          </h2>

          {dispute.notes.length === 0 ? (
            <div className="mt-5 rounded-xl bg-[#F8FAFC] p-5 text-sm text-[#6B7280]">
              No previous notes have been added to this demo dispute yet.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {dispute.notes.map((note) => (
                <article
                  key={note.id}
                  className={`rounded-xl border-l-4 ${accentClass[note.accent]} bg-[#F8FAFC] px-4 py-4`}
                >
                  <p className="text-sm leading-6 text-[#111827]">{note.text}</p>
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      {note.attachment ? (
                        <span className="inline-flex items-center gap-2 text-xs text-[#16A34A]">
                          <FileText size={13} />
                          {note.attachment}
                        </span>
                      ) : null}
                      {note.attachment ? (
                        <button
                          type="button"
                          onClick={() =>
                            setNotice(
                              "Attachment preview is demo-only until backend evidence exists.",
                            )
                          }
                          className="inline-flex items-center gap-2 text-xs text-[#FF6B00]"
                        >
                          <Eye size={13} />
                          View
                        </button>
                      ) : null}
                    </div>
                    <p className="text-xs text-[#111827]">
                      Sent by {note.sentBy} <span className="ml-4">{note.time}</span>
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}

          <p className={`mt-5 inline-flex items-center gap-2 text-sm ${statusTone.className}`}>
            <Info size={14} />
            Current visual status: {statusTone.label}
          </p>
        </section>
      </main>
    </div>
  );
}
