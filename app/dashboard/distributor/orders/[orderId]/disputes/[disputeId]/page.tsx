"use client";

import { useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  MessageCircle,
  Upload,
} from "lucide-react";

import Header from "../../../../../component/header";
import { Skeleton } from "@/components/base";
import { AddDisputeResponse } from "@/components/disputes/AddDisputeResponse";
import { DisputeActivityTimeline } from "@/components/disputes/DisputeActivityTimeline";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppSelector";
import { useOrderDispute } from "@/hooks/useOrderDisputes";
import { addOrderDisputeEvidence } from "@/store/slices/order-dispute-slice";
import { formatNaira } from "@/lib/wallet-format";
import { getOrderDisplayId } from "@/constants/demoBuyerOrders";
import {
  buildDisputeActivity,
  getDisputeAmount,
  getDisputeBuyerAvatar,
  getDisputeBuyerName,
  getDisputeDisplayId,
  getDisputeOrder,
  getDisputeOutcomeLabel,
  getDisputeProductImage,
  getDisputeProductName,
  getDisputeStatusTone,
} from "@/lib/order-dispute-presenter";
import type { OrderDispute } from "@/types/order-dispute";

const formatDateTime = (value: string | undefined) => {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
};

function SummaryDivider() {
  return <div className="hidden h-[72px] w-px bg-[#DDE0E5] lg:block" />;
}

function SummaryCard({ dispute }: { dispute: OrderDispute }) {
  const order = getDisputeOrder(dispute);
  const productImage = getDisputeProductImage(dispute);
  const buyerAvatar = getDisputeBuyerAvatar(dispute);
  const resolved = dispute.status === "resolved";

  return (
    <section className="grid gap-5 rounded-2xl border border-[#DDE0E5] bg-white p-4 lg:grid-cols-[1fr_auto_1.4fr_auto_1fr_auto_1.1fr_auto_1.1fr] lg:items-center">
      <div>
        <p className="text-sm text-[#6B7280]">Order ID</p>
        <p className="mt-2 text-base font-semibold text-[#111827]">
          {getOrderDisplayId(
            order?._id ??
              (typeof dispute.order === "string" ? dispute.order : undefined),
          )}
        </p>
      </div>
      <SummaryDivider />

      <div>
        <p className="text-sm text-[#6B7280]">Product</p>
        <div className="mt-2 flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#F3F4F6]">
            {productImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={productImage}
                alt={getDisputeProductName(dispute)}
                className="size-full object-cover"
              />
            ) : (
              <FileText size={18} className="text-[#9CA3AF]" />
            )}
          </span>
          <p className="text-base font-semibold text-[#111827]">
            {getDisputeProductName(dispute)}
          </p>
        </div>
      </div>
      <SummaryDivider />

      <div>
        <p className="text-sm text-[#6B7280]">Amount</p>
        <p className="mt-2 text-base font-semibold text-[#111827]">
          {formatNaira(getDisputeAmount(dispute))}
        </p>
        <p className="text-sm text-[#6B7280]">Escrow Payment</p>
      </div>
      <SummaryDivider />

      <div>
        <p className="text-sm text-[#6B7280]">Buyer</p>
        <div className="mt-2 flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#DDE0E5]">
            {buyerAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={buyerAvatar}
                alt={getDisputeBuyerName(dispute)}
                className="size-full object-cover"
              />
            ) : null}
          </span>
          <div>
            <p className="text-base font-semibold text-[#111827]">
              {getDisputeBuyerName(dispute)}
            </p>
            <p className="text-sm text-[#6B7280]">Buyer</p>
          </div>
        </div>
      </div>
      <SummaryDivider />

      <div>
        <p className="text-sm text-[#6B7280]">SLA</p>
        <div className="mt-2 flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#DDE0E5] text-[#6B7280]">
            <Clock size={20} />
          </span>
          <div>
            <p className="text-base font-semibold text-[#111827]">24-48 hours</p>
            <p className="text-sm text-[#6B7280]">
              {resolved ? "completed" : "in progress"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function CaseDetailsCard({ dispute }: { dispute: OrderDispute }) {
  return (
    <section className="rounded-2xl border border-[#DDE0E5] bg-white p-5">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-[#111827]">
        <FileText size={20} className="text-[#6B7280]" />
        Case Details
      </h2>
      <div className="mt-5 rounded-xl border border-[#F3F4F6] p-3">
        <p className="text-sm text-[#6B7280]">Reason</p>
        <span className="mt-2 inline-flex rounded-lg bg-[#FFE3DD] px-3 py-1 text-xs font-medium text-[#E33C13]">
          {dispute.reason}
        </span>
        <p className="mt-3 text-sm text-[#6B7280]">Buyer&apos;s message</p>
        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#6B7280]">
          {dispute.description}
        </p>
      </div>
    </section>
  );
}

function CaseActionCard({
  dispute,
  onUpload,
  uploading,
  onRespond,
  onContactBuyer,
}: {
  dispute: OrderDispute;
  onUpload: () => void;
  uploading: boolean;
  onRespond: () => void;
  onContactBuyer: () => void;
}) {
  const resolved = dispute.status === "resolved";
  return (
    <section className="rounded-2xl border border-[#DDE0E5] bg-white p-5">
      <h2 className="text-lg font-semibold text-[#111827]">Case Action</h2>
      <p className="mt-5 text-base leading-7 text-[#4B5563]">
        {resolved
          ? "This dispute case has been resolved."
          : "This dispute case is being resolved"}
      </p>
      <div className="mt-5 flex flex-col gap-4">
        {resolved ? (
          <button
            type="button"
            onClick={onContactBuyer}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#017BED] text-sm font-medium text-[#017BED]"
          >
            Contact Buyer
            <MessageCircle size={17} />
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onRespond}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#017BED] text-sm font-medium text-[#017BED]"
            >
              Respond to Dispute
              <MessageCircle size={17} />
            </button>
            <button
              type="button"
              onClick={onUpload}
              disabled={uploading}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-white disabled:opacity-60"
            >
              {uploading ? "Uploading…" : "Upload Evidence"}
              <Upload size={17} />
            </button>
          </>
        )}
      </div>
    </section>
  );
}

function FinalDecisionsCard({ dispute }: { dispute: OrderDispute }) {
  const refundsBuyer = dispute.resolutionOutcome === "refund_buyer";
  const tone = getDisputeStatusTone(
    dispute.status,
    dispute.resolutionOutcome,
    "seller",
  );
  return (
    <section className="rounded-2xl border border-[#DDE0E5] bg-white p-5">
      <div className="flex items-center gap-3">
        <span className="flex size-7 items-center justify-center rounded-full bg-[#16A34A] text-white">
          <CheckCircle2 size={16} />
        </span>
        <div>
          <h2 className="text-base font-semibold text-[#111827]">Final Decision</h2>
          <p className={`text-sm font-medium ${tone.textClassName}`}>
            {tone.detailLabel}
          </p>
        </div>
      </div>

      <dl className="mt-6 space-y-5 text-sm">
        <div>
          <dt className="text-[#8A94A6]">Outcome</dt>
          <dd className="mt-1 font-medium text-[#111827]">
            {getDisputeOutcomeLabel(dispute.resolutionOutcome, "seller")}
          </dd>
        </div>
        {refundsBuyer ? (
          <div className="border-t border-[#F3F4F6] pt-4">
            <dt className="text-[#8A94A6]">Refund Amount</dt>
            <dd className="mt-1 font-medium text-[#111827]">
              {formatNaira(getDisputeAmount(dispute))}
            </dd>
          </div>
        ) : null}
        <div className="border-t border-[#F3F4F6] pt-4">
          <dt className="text-[#8A94A6]">Resolved by</dt>
          <dd className="mt-1 font-medium text-[#111827]">Support Team</dd>
        </div>
        {dispute.resolutionNote ? (
          <div className="border-t border-[#F3F4F6] pt-4">
            <dt className="text-[#8A94A6]">Resolved Note</dt>
            <dd className="mt-1 leading-6 text-[#111827]">{dispute.resolutionNote}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}

function ResolvedBanner({ dispute }: { dispute: OrderDispute }) {
  const refundsBuyer = dispute.resolutionOutcome === "refund_buyer";
  return (
    <section className="flex items-start gap-3 rounded-2xl border border-[#86EFAC] bg-[#F0FDF4] p-5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#16A34A] text-white">
        <CheckCircle2 size={17} />
      </span>
      <div>
        <p className="text-sm font-semibold text-[#111827]">
          Admin resolved the dispute
        </p>
        <p className="mt-1 text-sm text-[#4B5563]">
          {refundsBuyer
            ? `Refund approved in favour of the buyer. ${formatNaira(
                getDisputeAmount(dispute),
              )} has been refunded to the buyer.`
            : dispute.resolutionNote ||
              getDisputeOutcomeLabel(dispute.resolutionOutcome, "seller")}
        </p>
      </div>
    </section>
  );
}

export default function DistributorDisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.data?.tokens?.accessToken);
  const currentUserId = useAppSelector((s) => s.auth.data?._id);
  const disputeId = params.disputeId as string;
  const { dispute: loadedDispute, isLoading, isError, message } =
    useOrderDispute(disputeId);

  const dispute = loadedDispute?._id === disputeId ? loadedDispute : null;

  const uploadRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const tone = useMemo(
    () =>
      dispute
        ? getDisputeStatusTone(dispute.status, dispute.resolutionOutcome, "seller")
        : null,
    [dispute],
  );
  const activity = useMemo(
    () =>
      dispute
        ? buildDisputeActivity(dispute, { currentUserId, viewerRole: "seller" })
        : [],
    [dispute, currentUserId],
  );

  const handleUploadEvidence = async (file: File | undefined) => {
    if (!file || !token || !dispute) return;
    setUploading(true);
    try {
      await dispatch(
        addOrderDisputeEvidence({ token, disputeId: dispute._id, file }),
      ).unwrap();
    } finally {
      setUploading(false);
    }
  };

  const contactBuyer = () => {
    const buyerId =
      dispute && typeof dispute.buyer === "object" ? dispute.buyer._id : undefined;
    router.push(
      buyerId
        ? `/dashboard/distributor/message?to=${buyerId}`
        : "/dashboard/distributor/message",
    );
  };

  const scrollToResponse = () => {
    document
      .getElementById("dispute-response")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div>
      <Header
        title="Orders & Disputes"
        description="View and respond to order disputes"
      />

      <main className="space-y-5 bg-[#F9FAFB] p-4 md:p-6">
        <button
          type="button"
          onClick={() => router.push("/dashboard/distributor/orders")}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#111827]"
        >
          <ArrowLeft size={17} />
          Go Back
        </button>

        {isLoading && !dispute ? (
          <div className="space-y-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-32" />
            <Skeleton className="h-64" />
          </div>
        ) : isError || !dispute ? (
          <div className="rounded-2xl border border-[#DDE0E5] bg-white p-10 text-center">
            <p className="text-sm text-[#6B7280]">
              {message || "We couldn't load this dispute. Please try again."}
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-xl font-semibold text-[#111827]">
                  My Dispute: {getDisputeDisplayId(dispute._id)}
                </h1>
                <p className="mt-1 text-base font-medium text-[#6B7280]">
                  Opened on {formatDateTime(dispute.createdAt)}
                </p>
                {tone ? (
                  <span
                    className={`mt-4 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${tone.badgeClassName}`}
                  >
                    {tone.detailLabel}
                    {tone.isResolved ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <Clock size={16} />
                    )}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={contactBuyer}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#017BED] px-5 text-sm font-medium text-[#017BED]"
                >
                  Contact Buyer
                  <MessageCircle size={17} />
                </button>
                <button
                  type="button"
                  onClick={() => uploadRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-white disabled:opacity-60"
                >
                  <Upload size={17} />
                  {uploading ? "Uploading…" : "Upload Evidence"}
                </button>
                <input
                  ref={uploadRef}
                  type="file"
                  className="sr-only"
                  accept="image/*,application/pdf,.doc,.docx"
                  onChange={(event) =>
                    handleUploadEvidence(event.target.files?.[0] ?? undefined)
                  }
                />
              </div>
            </div>

            <SummaryCard dispute={dispute} />

            <div className="grid gap-4 lg:grid-cols-[360px_1fr] lg:items-start">
              <div className="space-y-4">
                {tone?.isResolved ? <FinalDecisionsCard dispute={dispute} /> : null}
                <CaseDetailsCard dispute={dispute} />
                <CaseActionCard
                  dispute={dispute}
                  uploading={uploading}
                  onUpload={() => uploadRef.current?.click()}
                  onRespond={scrollToResponse}
                  onContactBuyer={contactBuyer}
                />
              </div>

              <div className="space-y-4">
                <DisputeActivityTimeline events={activity} showHeader={false} />
                {tone?.isResolved ? <ResolvedBanner dispute={dispute} /> : null}
              </div>
            </div>

            {tone?.isResolved ? null : (
              <div id="dispute-response">
                <AddDisputeResponse disputeId={dispute._id} />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
