"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, MapPin, MessageCircle } from "lucide-react";
import Header from "../../../component/header";
import { Button, Skeleton } from "@/components/base";
import { useRfqDetailQuery, useApproveQuoteMutation } from "@/hooks/queries/rfqs";
import { QUOTE_STATUS_LABELS, RFQ_STATUS_LABELS, type Quote, type UserRef } from "@/types/rfq";
import { buildMessagingComposeHref } from "@/utils/messagingRoutes";

const money = (value?: number | null) =>
  value == null
    ? "--"
    : new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 0,
      }).format(value);

const distributorName = (quote: Quote) => {
  if (typeof quote.distributor === "string") return "Verified supplier";
  const distributor = quote.distributor as UserRef;
  return distributor.businessName || distributor.distributorStoreProfile?.businessName ||
    `${distributor.firstName || ""} ${distributor.lastName || ""}`.trim() || "Verified supplier";
};

const distributorId = (quote: Quote) =>
  typeof quote.distributor === "string" ? quote.distributor : quote.distributor?._id;

export default function BuyerRfqDetailPage() {
  const params = useParams<{ rfqId: string }>();
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useRfqDetailQuery(params.rfqId);
  const approveQuote = useApproveQuoteMutation();

  if (isLoading) {
    return <div><Header title="Quote details" /><div className="p-6 space-y-4"><Skeleton className="h-12 w-48" /><Skeleton className="h-80" /></div></div>;
  }

  if (!data || isError) {
    return (
      <div>
        <Header title="Quote details" />
        <div className="p-6"><p className="text-gray2">This RFQ could not be loaded.</p><Button title="Try again" variant="primary" size="sm" onClick={() => void refetch()} className="mt-4 !w-auto" /></div>
      </div>
    );
  }

  const { rfq, quotes } = data;
  const address = rfq.deliveryAddress
    ? [rfq.deliveryAddress.address, rfq.deliveryAddress.city, rfq.deliveryAddress.state].filter(Boolean).join(", ")
    : "No delivery address provided";
  const actionable = rfq.status === "responded_partial" || rfq.status === "responded_complete";

  return (
    <div className="min-h-full bg-gray7">
      <Header title="Quote details" />
      <main className="mx-auto max-w-6xl p-4 md:p-6 space-y-5">
        <Button title="Back to RFQs" variant="secondaryLight" size="sm" iconLeft={<ArrowLeft size={16} />} onClick={() => router.push("/dashboard/buyer/rfqs")} className="!w-auto" />

        <section className="bg-white border border-gray5 rounded-[12px] p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm text-gray3">Request for quote</p>
              <h1 className="mt-1 text-xl font-semibold text-gray1">{rfq.title || rfq.items[0]?.productName || "Sourcing request"}</h1>
              <p className="mt-2 text-sm text-gray2">{rfq.items.length} item{rfq.items.length === 1 ? "" : "s"} · {rfq.targetDistributors.length} matched supplier{rfq.targetDistributors.length === 1 ? "" : "s"}</p>
            </div>
            <span className="inline-flex self-start rounded-full bg-primary-light px-3 py-1 text-sm font-medium text-primary">{RFQ_STATUS_LABELS[rfq.status]}</span>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[8px] bg-gray7 p-4"><p className="text-xs text-gray3">Delivery timeline</p><p className="mt-1 text-sm font-medium text-gray1">{rfq.deliveryTimeline || "Not specified"}</p></div>
            <div className="rounded-[8px] bg-gray7 p-4"><p className="text-xs text-gray3">Delivery address</p><p className="mt-1 flex gap-2 text-sm font-medium text-gray1"><MapPin size={16} className="mt-0.5 shrink-0 text-primary" />{address}</p></div>
          </div>
          {rfq.additionalNotes ? <p className="mt-4 text-sm text-gray2">{rfq.additionalNotes}</p> : null}
          {rfq.attachments?.length ? <div className="mt-4 flex flex-wrap gap-3">{rfq.attachments.map((file) => <a key={file.cloudinary_id} href={file.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-primary hover:underline"><FileText size={16} />{file.originalName || "Attachment"}</a>)}</div> : null}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-gray1">Supplier responses</h2><span className="text-sm text-gray3">{quotes.length} received</span></div>
          {quotes.length === 0 ? <div className="rounded-[12px] border border-gray5 bg-white p-8 text-center text-sm text-gray3">Matched suppliers will appear here when they respond.</div> : quotes.map((quote) => {
            const availableLines = quote.items.filter((item) => item.available);
            const canApprove = actionable && quote.status === "quoted" && availableLines.length > 0;
            const chatHref = buildMessagingComposeHref("buyer", distributorId(quote));
            return <article key={quote._id} className="rounded-[12px] border border-gray5 bg-white p-5 md:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="font-semibold text-gray1">{distributorName(quote)}</h3><p className="mt-1 text-sm text-gray3">{QUOTE_STATUS_LABELS[quote.status]}</p></div><p className="text-xl font-semibold text-primary">{money(quote.totalPrice)}</p></div>
              <div className="mt-5 overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b border-gray5 text-gray3"><tr><th className="pb-3 font-medium">Item</th><th className="pb-3 font-medium">Availability</th><th className="pb-3 font-medium">Qty</th><th className="pb-3 text-right font-medium">Unit price</th></tr></thead><tbody>{rfq.items.map((rfqItem, index) => { const line = quote.items.find((item) => item.rfqItemIndex === index); return <tr key={`${quote._id}-${index}`} className="border-b border-gray6 last:border-0"><td className="py-3 text-gray1">{rfqItem.productName}</td><td className={`py-3 ${line?.available ? "text-success" : "text-danger"}`}>{line?.available ? "Available" : "Unavailable"}</td><td className="py-3 text-gray1">{line?.quantity ?? "--"}</td><td className="py-3 text-right text-gray1">{money(line?.pricePerUnit)}</td></tr>; })}</tbody></table></div>
              {quote.warranty || quote.notes ? <p className="mt-4 text-sm text-gray2">{[quote.warranty, quote.notes].filter(Boolean).join(" · ")}</p> : null}
              {canApprove || chatHref ? <div className="mt-5 flex flex-wrap justify-end gap-3">{chatHref ? <Link href={chatHref} className="inline-flex h-12 items-center gap-2 rounded-lg border border-fuchsia-300 px-5 text-sm font-medium text-fuchsia-500 hover:bg-fuchsia-50"><MessageCircle size={17} />Open chat</Link> : null}{canApprove ? <Button title={approveQuote.isPending ? "Approving..." : "Approve quote"} variant="primary" size="md" isBusy={approveQuote.isPending} onClick={() => approveQuote.mutate(quote._id, { onSuccess: (result) => router.push(`/dashboard/buyer/orders/${result.data._id}`) })} className="!w-auto" /> : null}</div> : null}
            </article>;
          })}
        </section>
      </main>
    </div>
  );
}
