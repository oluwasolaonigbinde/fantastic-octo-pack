"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, FileText } from "lucide-react";
import Header from "../../../component/header";
import { Button, Skeleton } from "@/components/base";
import { useAppSelector } from "@/hooks/useAppSelector";
import { useRfqDetailQuery } from "@/hooks/queries/rfqs";
import { QUOTE_STATUS_LABELS, RFQ_STATUS_LABELS } from "@/types/rfq";
import type { Quote, UserRef } from "@/types/rfq";
import rfqService from "@/services/rfqService";

// ─── Sub-component ────────────────────────────────────────────────────────────

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-gray2">{label}</span>
      <span className="text-sm text-gray1">{value}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BuyerRfqDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: authData } = useAppSelector((state) => state.auth);
  const rfqId = params.rfqId as string;
  const { data: currentRfq, isLoading } = useRfqDetailQuery(rfqId);

  const [isActing, setIsActing] = useState<string | null>(null); // quoteId being acted on
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);
  const [localQuoteStatuses, setLocalQuoteStatuses] = useState<
    Record<string, Quote["status"]>
  >({});

  const handleAcceptOffer = useCallback(
    async (quoteId: string) => {
      if (!authData?.tokens?.accessToken) return;
      setIsActing(quoteId);
      try {
        const result = await rfqService.acceptOffer(
          authData.tokens.accessToken,
          quoteId
        );
        if (result.success && result.data) {
          router.push(`/dashboard/buyer/orders/${result.data._id}`);
        }
      } catch {
        // silent
      } finally {
        setIsActing(null);
      }
    },
    [authData, router]
  );

  const handleRejectOffer = useCallback(
    async (quoteId: string) => {
      if (!authData?.tokens?.accessToken) return;
      setIsActing(quoteId);
      try {
        await rfqService.rejectOffer(authData.tokens.accessToken, quoteId);
        setLocalQuoteStatuses((prev) => ({
          ...prev,
          [quoteId]: "rejected_by_buyer",
        }));
      } catch {
        // silent
      } finally {
        setIsActing(null);
      }
    },
    [authData]
  );

  const handleSendReminder = useCallback(async () => {
    if (!authData?.tokens?.accessToken || !rfqId) return;
    setIsSendingReminder(true);
    try {
      await rfqService.sendReminder(authData.tokens.accessToken, rfqId);
      setReminderSent(true);
      setTimeout(() => setReminderSent(false), 3000);
    } catch {
      // silent
    } finally {
      setIsSendingReminder(false);
    }
  }, [authData, rfqId]);

  const getDistributorName = (q: Quote) => {
    const d = q.distributor;
    if (typeof d === "object" && d !== null) {
      return (
        `${(d as UserRef).firstName || ""} ${(d as UserRef).lastName || ""}`.trim() ||
        "Unknown distributor"
      );
    }
    return "Unknown distributor";
  };

  const formatCurrency = (val?: number) =>
    val != null
      ? new Intl.NumberFormat("en-NG", {
          style: "currency",
          currency: "NGN",
          minimumFractionDigits: 0,
        }).format(val)
      : "—";

  const rfq = currentRfq?.rfq;
  const quotes = currentRfq?.quotes || [];

  if (isLoading || !currentRfq) {
    return (
      <div>
        <Header title="RFQ Details" />
        <div className="p-6 space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const canAct =
    rfq &&
    (rfq.status === "responded_partial" || rfq.status === "responded_complete");

  return (
    <div>
      <Header title="RFQ Details" />
      <div className="p-4 md:p-6 bg-gray7 space-y-4">
        <Button
          title="Back to RFQs"
          variant="secondaryLight"
          size="sm"
          iconLeft={<ArrowLeft size={16} />}
          onClick={() => router.push("/dashboard/buyer/rfqs")}
          className="!w-auto"
        />

        {/* RFQ summary */}
        <div className="card p-4 md:p-6 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">
                {rfq?.items[0]?.productName || "Request for Quote"}
              </h2>
              <p className="text-sm text-gray3 mt-0.5">
                {rfq?.items.length} item(s) &middot;{" "}
                {rfq?.targetDistributors.length} distributor(s)
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium ${
                rfq?.status === "converted_to_order"
                  ? "bg-success-light text-success"
                  : rfq?.status === "closed"
                    ? "bg-gray-100 text-gray3"
                    : rfq?.status?.startsWith("responded")
                      ? "bg-primary-light text-primary"
                      : "bg-warning-light text-warning"
              }`}
            >
              {RFQ_STATUS_LABELS[rfq?.status || ""] || rfq?.status}
            </span>
          </div>

          {rfq?.additionalNotes && (
            <p className="text-sm text-gray2">{rfq.additionalNotes}</p>
          )}
          {rfq?.deliveryLocation && (
            <p className="text-sm text-gray2">
              Delivery to: {rfq.deliveryLocation}
            </p>
          )}

          {/* Attachments */}
          {rfq?.attachments && rfq.attachments.length > 0 && (
            <div className="flex flex-col gap-2 pt-1">
              <p className="text-sm font-medium text-gray2">Attachments</p>
              {rfq.attachments.map((att) => (
                <a
                  key={att.cloudinary_id}
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary underline"
                >
                  <FileText size={14} />
                  {att.originalName || "Attachment"}
                </a>
              ))}
            </div>
          )}

          {/* Send Reminder */}
          <div className="pt-2">
            <Button
              title={
                isSendingReminder
                  ? "Sending..."
                  : reminderSent
                    ? "Reminder Sent!"
                    : "Send Reminder"
              }
              variant={reminderSent ? "primaryLight" : "secondaryLight"}
              size="sm"
              isBusy={isSendingReminder}
              onClick={handleSendReminder}
              disabled={isSendingReminder || reminderSent}
              className="!w-auto"
            />
          </div>
        </div>

        {/* Quote responses */}
        <div className="card p-4 md:p-6">
          <h3 className="font-semibold mb-4">
            Quote Responses ({quotes.length})
          </h3>
          {quotes.length === 0 ? (
            <p className="text-sm text-gray3">
              No responses yet. Distributors will reply to your request here.
            </p>
          ) : (
            <div className="space-y-4">
              {quotes.map((q) => {
                const effectiveStatus = localQuoteStatuses[q._id] ?? q.status;
                const isQuoteActing = isActing === q._id;
                const canActOnQuote =
                  canAct && effectiveStatus === "quoted";

                return (
                  <div
                    key={q._id}
                    className={`rounded-xl border p-4 space-y-3 ${
                      effectiveStatus === "selected_for_order"
                        ? "border-success bg-success-light/20"
                        : effectiveStatus === "rejected_by_buyer"
                          ? "border-gray5 bg-gray-50 opacity-60"
                          : "border-gray5"
                    }`}
                  >
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{getDistributorName(q)}</p>
                        <span
                          className={`text-xs font-medium ${
                            effectiveStatus === "selected_for_order"
                              ? "text-success"
                              : effectiveStatus === "rejected_by_buyer"
                                ? "text-gray3"
                                : effectiveStatus === "quoted"
                                  ? "text-primary"
                                  : "text-warning"
                          }`}
                        >
                          {QUOTE_STATUS_LABELS[effectiveStatus] || effectiveStatus}
                        </span>
                      </div>
                      {q.totalPrice != null && (
                        <p className="text-lg font-bold text-primary shrink-0">
                          {formatCurrency(q.totalPrice)}
                        </p>
                      )}
                    </div>

                    {/* Quote fields */}
                    <div className="grid grid-cols-2 gap-3">
                      {q.pricePerUnit != null && (
                        <DetailRow
                          label="Unit price"
                          value={formatCurrency(q.pricePerUnit)}
                        />
                      )}
                      {q.availableModel && (
                        <DetailRow label="Model" value={q.availableModel} />
                      )}
                      {q.warranty && (
                        <DetailRow label="Warranty" value={q.warranty} />
                      )}
                      {q.leadTimeDays != null && (
                        <DetailRow
                          label="Delivery time"
                          value={`${q.leadTimeDays} days`}
                        />
                      )}
                      {q.stockStatus && (
                        <DetailRow label="Stock" value={q.stockStatus} />
                      )}
                    </div>

                    {q.notes && (
                      <p className="text-sm text-gray2">{q.notes}</p>
                    )}
                    {q.terms && (
                      <p className="text-sm text-gray2">
                        <span className="font-medium">Terms:</span> {q.terms}
                      </p>
                    )}

                    {/* Images */}
                    {q.images && q.images.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {q.images.map((img) => (
                          <a
                            key={img.cloudinary_id}
                            href={img.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary underline"
                          >
                            {img.originalName || "Image"}
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Catalogue */}
                    {q.catalogue && (
                      <a
                        href={q.catalogue.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-primary underline"
                      >
                        <Download size={12} />
                        {q.catalogue.originalName || "Catalogue.pdf"}
                      </a>
                    )}

                    {/* Accept / Reject */}
                    {canActOnQuote && (
                      <div className="flex gap-3 pt-1">
                        <Button
                          title={isQuoteActing ? "Processing..." : "Accept Offer"}
                          variant="primary"
                          size="sm"
                          isBusy={isQuoteActing}
                          onClick={() => handleAcceptOffer(q._id)}
                          disabled={!!isActing}
                          className="!w-auto"
                        />
                        <Button
                          title={isQuoteActing ? "..." : "Reject Offer"}
                          variant="secondaryLight"
                          size="sm"
                          isBusy={isQuoteActing}
                          onClick={() => handleRejectOffer(q._id)}
                          disabled={!!isActing}
                          className="!w-auto"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
