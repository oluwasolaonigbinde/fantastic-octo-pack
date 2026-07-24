"use client";

/**
 * Buyer view of the responses to one RFQ (the "Single Quotes" screen).
 *
 * Everything on this page comes from `GET /rfqs/:id`: the request header from
 * the RFQ, the invited count from `targetDistributors`, and the table from the
 * quotes. Accepting calls `POST /rfqs/quotes/:id/approve` (which creates the
 * order), declining calls `POST /rfqs/quotes/:id/reject`, and the reminder
 * button calls `POST /rfqs/:id/remind` for the distributors still pending.
 */

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BellRing,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  FileText,
  Hash,
  MapPin,
  MessageCircle,
  Paperclip,
  Search,
} from "lucide-react";

import Header from "../../../component/header";
import { Button, EmptyState, Skeleton } from "@/components/base";
import {
  useApproveQuoteMutation,
  useRejectQuoteMutation,
  useRfqDetailQuery,
  useSendRfqReminderMutation,
} from "@/hooks/queries/rfqs";
import { RFQ_STATUS_LABELS, type Quote } from "@/types/rfq";
import { buildMessagingComposeHref } from "@/utils/messagingRoutes";
import QuoteDetailModal from "../QuoteDetailModal";
import {
  deliveryAddressLine,
  distributorEmail,
  distributorId,
  distributorInitials,
  distributorName,
  money,
  offerKind,
  OFFER_KIND_CLASSES,
  OFFER_KIND_LABELS,
  offeredModel,
  quoteTotal,
  respondedQuotes,
  rfqTitle,
  shortDate,
} from "../quotePresentation";

const PAGE_SIZE = 5;

export default function BuyerRfqResponsesPage() {
  const params = useParams<{ rfqId: string }>();
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useRfqDetailQuery(params.rfqId);
  const approveQuote = useApproveQuoteMutation();
  const rejectQuote = useRejectQuoteMutation();
  const sendReminder = useSendRfqReminderMutation();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [openQuoteId, setOpenQuoteId] = useState<string | null>(null);
  const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reminderNote, setReminderNote] = useState<string | null>(null);

  const quotes = useMemo(() => data?.quotes ?? [], [data]);
  const responded = useMemo(() => respondedQuotes(quotes), [quotes]);
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return responded;
    return responded.filter((quote) =>
      `${distributorName(quote)} ${distributorEmail(quote)}`.toLowerCase().includes(term),
    );
  }, [responded, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageQuotes = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  if (isLoading) {
    return (
      <div>
        <Header title="Quote responses" />
        <div className="space-y-4 p-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-40" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (!data || isError) {
    return (
      <div>
        <Header title="Quote responses" />
        <div className="p-6">
          <p className="text-gray2">This request could not be loaded.</p>
          <Button
            title="Try again"
            variant="primary"
            size="sm"
            onClick={() => void refetch()}
            className="mt-4 !w-auto"
          />
        </div>
      </div>
    );
  }

  const { rfq } = data;
  const openQuote = quotes.find((quote) => quote._id === openQuoteId) ?? null;
  const firstItem = rfq.items[0];
  const coverImage = rfq.attachments?.find((file) =>
    /\.(png|jpe?g|webp|gif)$/i.test(file.originalName || file.url),
  );
  const pendingCount = quotes.filter((quote) => quote.status === "pending_response").length;
  const totalQuantity = rfq.items.reduce((sum, item) => sum + item.quantity, 0);

  const accept = (quote: Quote) => {
    setActionError(null);
    approveQuote.mutate(quote._id, {
      onSuccess: (result) => {
        setOpenQuoteId(null);
        router.push(`/dashboard/buyer/orders/${result.data._id}`);
      },
      onError: (error) =>
        setActionError(error instanceof Error ? error.message : "Unable to accept this quote."),
    });
  };

  const decline = (quote: Quote) => {
    setActionError(null);
    rejectQuote.mutate(
      { quoteId: quote._id },
      {
        onSuccess: () => setOpenQuoteId(null),
        onError: (error) =>
          setActionError(error instanceof Error ? error.message : "Unable to decline this quote."),
      },
    );
  };

  const remind = () => {
    setReminderNote(null);
    sendReminder.mutate(
      { rfqId: rfq._id },
      {
        onSuccess: (result) => setReminderNote(result.message || "Reminder sent."),
        onError: (error) =>
          setReminderNote(error instanceof Error ? error.message : "Unable to send the reminder."),
      },
    );
  };

  return (
    <div className="min-h-full bg-gray7">
      <Header title="Quote responses" />
      <main className="mx-auto max-w-[1160px] space-y-4 p-4 md:space-y-5 md:p-6">
        <Button
          title="Back to RFQ details"
          variant="secondaryLight"
          size="sm"
          iconLeft={<ArrowLeft size={16} />}
          onClick={() => router.push("/dashboard/buyer/rfqs")}
          className="!w-auto"
        />

        <div>
          <h1 className="text-xl font-semibold text-gray1 md:text-2xl">
            Responses for {rfqTitle(rfq)} (Qty: {totalQuantity})
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            {rfq.publicId ? (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-primary-light px-2.5 py-1 font-medium text-primary">
                <Hash size={14} />
                {rfq.publicId}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5 text-gray2">
              <CalendarDays size={15} className="text-gray3" />
              Request date: {shortDate(rfq.submittedAt || rfq.createdAt)}
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-primary">
              {RFQ_STATUS_LABELS[rfq.status]}
            </span>
          </div>
        </div>

        <section className="rounded-xl border border-gray5 bg-white p-4 md:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex min-w-0 gap-4">
              {coverImage ? (
                <Image
                  src={coverImage.url}
                  alt={firstItem?.productName || "Requested product"}
                  width={172}
                  height={140}
                  className="hidden h-[140px] w-[172px] shrink-0 rounded-lg object-cover sm:block"
                />
              ) : null}
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-gray1">
                  {firstItem?.productName || rfqTitle(rfq)}
                </h2>
                <p className="mt-1 text-sm font-medium text-primary">
                  Product quantity: {firstItem?.quantity ?? totalQuantity} unit
                  {(firstItem?.quantity ?? totalQuantity) === 1 ? "" : "s"}
                  {rfq.items.length > 1 ? ` · ${rfq.items.length} line items` : ""}
                </p>
                {firstItem?.brand || firstItem?.model ? (
                  <p className="mt-1 text-sm text-gray3">
                    {[firstItem.brand, firstItem.model].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-white">
                <CheckCircle2 size={14} />
                {rfq.targetDistributors.length} distributor
                {rfq.targetDistributors.length === 1 ? "" : "s"} invited
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1.5 text-xs font-medium text-primary">
                <CheckCircle2 size={14} />
                {responded.length} response{responded.length === 1 ? "" : "s"} received
              </span>
            </div>
          </div>

          <div className="mt-5 border-t border-gray6 pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray3">
              Delivery address
            </p>
            <p className="mt-1.5 flex gap-2 text-sm text-gray1">
              <MapPin size={16} className="mt-0.5 shrink-0 text-primary" />
              {deliveryAddressLine(rfq)}
            </p>
          </div>

          {rfq.attachments?.length ? (
            <div className="mt-4 flex flex-wrap gap-3 border-t border-gray6 pt-4">
              {rfq.attachments.map((file) => (
                <a
                  key={file.cloudinary_id}
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <FileText size={16} />
                  {file.originalName || "Attachment"}
                </a>
              ))}
            </div>
          ) : null}

          {pendingCount > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray6 pt-4">
              <p className="text-sm text-gray3">
                {pendingCount} distributor{pendingCount === 1 ? " has" : "s have"} not responded yet.
              </p>
              <Button
                title={sendReminder.isPending ? "Sending..." : "Send reminder"}
                variant="secondaryLight"
                size="sm"
                iconLeft={<BellRing size={15} />}
                isBusy={sendReminder.isPending}
                onClick={remind}
                className="!w-auto"
              />
              {reminderNote ? <span className="text-sm text-gray2">{reminderNote}</span> : null}
            </div>
          ) : null}
        </section>

        <section className="rounded-xl border border-gray5 bg-white p-4 md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg font-semibold text-gray1">
              Distributor responses ({responded.length})
            </h2>
            <label className="relative md:w-[280px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray3" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Filter distributors"
                aria-label="Filter distributors"
                className="h-11 w-full rounded-lg border border-gray5 pl-9 pr-3 text-sm text-gray1 placeholder:text-gray3"
              />
            </label>
          </div>

          {responded.length === 0 ? (
            <EmptyState
              title="No responses yet"
              description="Invited distributors will appear here as soon as they answer this request."
            />
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray3">
              No distributor matches “{search}”.
            </p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="mt-5 hidden overflow-x-auto md:block">
                <table className="w-full min-w-[900px] text-left">
                  <thead className="border-b border-gray6 text-xs uppercase tracking-wide text-gray3">
                    <tr>
                      <th className="pb-4 pr-4 font-medium">Distributor</th>
                      <th className="pb-4 pr-4 font-medium">Response</th>
                      <th className="pb-4 pr-4 font-medium">Model offered</th>
                      <th className="pb-4 pr-4 font-medium">Unit price</th>
                      <th className="pb-4 pr-4 font-medium">Total quote</th>
                      <th className="pb-4 pr-4 font-medium">Notes &amp; docs</th>
                      <th className="pb-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageQuotes.map((quote) => {
                      const kind = offerKind(quote, rfq);
                      const line = quote.items.find((item) => item.rfqItemIndex === 0);
                      const docs = (quote.images?.length ?? 0) + (quote.catalogue ? 1 : 0);
                      return (
                        <tr key={quote._id} className="border-b border-gray6 text-sm last:border-0">
                          <td className="py-4 pr-4">
                            <div className="flex items-center gap-2.5">
                              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-light text-xs font-semibold text-primary">
                                {distributorInitials(quote)}
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate font-medium text-gray1">
                                  {distributorName(quote)}
                                </span>
                                <span className="block truncate text-xs text-gray3">
                                  {distributorEmail(quote)}
                                </span>
                              </span>
                            </div>
                          </td>
                          <td className={`py-4 pr-4 font-medium ${OFFER_KIND_CLASSES[kind]}`}>
                            {OFFER_KIND_LABELS[kind]}
                          </td>
                          <td className="py-4 pr-4 text-gray1">{offeredModel(quote, rfq)}</td>
                          <td className="py-4 pr-4 text-gray1">{money(line?.pricePerUnit)}</td>
                          <td className="py-4 pr-4 font-medium text-gray1">
                            {money(quoteTotal(quote))}
                          </td>
                          <td className="py-4 pr-4 text-gray2">
                            <span className="flex items-center gap-1.5">
                              <Paperclip size={14} className="shrink-0 text-gray3" />
                              <span className="block max-w-[160px] truncate">
                                {quote.notes || (docs ? `${docs} attachment${docs === 1 ? "" : "s"}` : "--")}
                              </span>
                            </span>
                          </td>
                          <td className="py-4">
                            <button
                              type="button"
                              onClick={() => {
                                setActionError(null);
                                setOpenQuoteId(quote._id);
                              }}
                              className="font-medium text-primary hover:underline"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile accordions */}
              <div className="mt-5 space-y-3 md:hidden">
                {pageQuotes.map((quote) => {
                  const kind = offerKind(quote, rfq);
                  const line = quote.items.find((item) => item.rfqItemIndex === 0);
                  const expanded = expandedQuoteId === quote._id;
                  return (
                    <article key={quote._id} className="rounded-xl border border-gray5">
                      <button
                        type="button"
                        aria-expanded={expanded}
                        onClick={() => setExpandedQuoteId(expanded ? null : quote._id)}
                        className="flex w-full items-center justify-between gap-3 p-4 text-left"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-gray1">
                            {distributorName(quote)}
                          </span>
                          <span className="block truncate text-xs text-gray3">
                            {distributorEmail(quote)}
                          </span>
                        </span>
                        <ChevronDown
                          size={20}
                          className={`shrink-0 text-gray3 transition-transform ${expanded ? "rotate-180" : ""}`}
                        />
                      </button>
                      {expanded ? (
                        <div className="space-y-4 border-t border-gray6 p-4">
                          <dl className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <dt className="text-xs uppercase tracking-wide text-gray3">Response</dt>
                              <dd className={`mt-1 font-medium ${OFFER_KIND_CLASSES[kind]}`}>
                                {OFFER_KIND_LABELS[kind]}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs uppercase tracking-wide text-gray3">
                                Model offered
                              </dt>
                              <dd className="mt-1 text-gray1">{offeredModel(quote, rfq)}</dd>
                            </div>
                            <div>
                              <dt className="text-xs uppercase tracking-wide text-gray3">
                                Unit price
                              </dt>
                              <dd className="mt-1 text-gray1">{money(line?.pricePerUnit)}</dd>
                            </div>
                            <div>
                              <dt className="text-xs uppercase tracking-wide text-gray3">
                                Total quote
                              </dt>
                              <dd className="mt-1 font-medium text-gray1">
                                {money(quoteTotal(quote))}
                              </dd>
                            </div>
                          </dl>
                          {quote.notes ? (
                            <p className="flex gap-2 text-sm text-gray2">
                              <Paperclip size={14} className="mt-0.5 shrink-0 text-gray3" />
                              {quote.notes}
                            </p>
                          ) : null}
                          <Button
                            title="View full quote"
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setActionError(null);
                              setOpenQuoteId(quote._id);
                            }}
                            className="w-full"
                          />
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-col gap-3 border-t border-gray6 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray3">
                  Showing {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)} of{" "}
                  {filtered.length} response{filtered.length === 1 ? "" : "s"}
                </p>
                {pageCount > 1 ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setPage(currentPage - 1)}
                      className="h-9 rounded-lg border border-gray5 px-3 text-sm text-gray1 disabled:opacity-40"
                    >
                      Previous
                    </button>
                    {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
                      <button
                        key={pageNumber}
                        type="button"
                        onClick={() => setPage(pageNumber)}
                        aria-current={pageNumber === currentPage ? "page" : undefined}
                        className={`size-9 rounded-lg border text-sm ${
                          pageNumber === currentPage
                            ? "border-primary bg-primary text-white"
                            : "border-gray5 text-gray1"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={currentPage === pageCount}
                      onClick={() => setPage(currentPage + 1)}
                      className="h-9 rounded-lg border border-gray5 px-3 text-sm text-gray1 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </section>

        {quotes.some((quote) => quote.status === "selected_for_order") ? (
          <section className="rounded-xl border border-gray5 bg-white p-4 md:p-5">
            <h2 className="text-lg font-semibold text-gray1">Approved supplier</h2>
            <div className="mt-3 space-y-3">
              {quotes
                .filter((quote) => quote.status === "selected_for_order")
                .map((quote) => {
                  const chatHref = buildMessagingComposeHref("buyer", distributorId(quote));
                  return (
                    <div
                      key={quote._id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gray7 p-4"
                    >
                      <span className="font-medium text-gray1">{distributorName(quote)}</span>
                      {chatHref ? (
                        <Link
                          href={chatHref}
                          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                        >
                          <MessageCircle size={16} />
                          Open chat
                        </Link>
                      ) : null}
                    </div>
                  );
                })}
            </div>
          </section>
        ) : null}
      </main>

      <QuoteDetailModal
        open={Boolean(openQuote)}
        quote={openQuote}
        rfq={rfq}
        onClose={() => setOpenQuoteId(null)}
        onAccept={accept}
        onDecline={decline}
        isAccepting={approveQuote.isPending}
        isDeclining={rejectQuote.isPending}
        error={actionError}
      />
    </div>
  );
}
