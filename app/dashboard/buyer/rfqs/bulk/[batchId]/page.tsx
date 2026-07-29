"use client";

/**
 * Buyer view of one bulk RFQ batch.
 *
 * `POST /rfqs/bulk` creates one RFQ per uploaded row and groups them under a
 * batch, and the buyer has no batch-scoped read on the API — so the batch is
 * reassembled here from `GET /rfqs` (rows whose `bulkBatch` matches) plus each
 * row's `GET /rfqs/:id` for its quotes. Nothing is rendered that those two
 * reads do not return.
 */

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, Download, Info, Search } from "lucide-react";
import * as XLSX from "xlsx";

import Header from "../../../../component/header";
import { Button, EmptyState, Skeleton } from "@/components/base";
import {
  useApproveQuoteMutation,
  useBuyerRfqDetails,
  useBuyerRfqsQuery,
  useRejectQuoteMutation,
} from "@/hooks/queries/rfqs";
import { RFQ_STATUS_LABELS, type Quote, type Rfq } from "@/types/rfq";
import ProductResponsesModal from "../../ProductResponsesModal";
import {
  batchIdOf,
  relativeTime,
  respondedQuotes,
  productLabel,
  shortDate,
} from "../../quotePresentation";

const PAGE_SIZE = 6;

const statusClass = (rfq: Rfq) => {
  if (rfq.status === "converted_to_order") return "text-success";
  if (rfq.status === "responded_partial" || rfq.status === "responded_complete")
    return "text-primary";
  if (rfq.status === "expired" || rfq.status === "closed") return "text-danger";
  return "text-gray3";
};

export default function BuyerBulkRfqPage() {
  const params = useParams<{ batchId: string }>();
  const router = useRouter();
  const { data: rfqs, isLoading } = useBuyerRfqsQuery();
  const approveQuote = useApproveQuoteMutation();
  const rejectQuote = useRejectQuoteMutation();

  const batchRfqs = useMemo(
    () => (rfqs ?? []).filter((rfq) => batchIdOf(rfq) === params.batchId),
    [rfqs, params.batchId],
  );
  const details = useBuyerRfqDetails(batchRfqs.map((rfq) => rfq._id));
  const quotesByRfq = useMemo(
    () =>
      new Map(
        batchRfqs.map((rfq, index) => [rfq._id, details[index]?.data?.quotes ?? ([] as Quote[])]),
      ),
    [batchRfqs, details],
  );

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [openRfqId, setOpenRfqId] = useState<string | null>(null);
  const [expandedRfqId, setExpandedRfqId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return batchRfqs;
    return batchRfqs.filter((rfq) =>
      `${productLabel(rfq)} ${rfq.publicId ?? ""}`.toLowerCase().includes(term),
    );
  }, [batchRfqs, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageRfqs = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const openRfq = batchRfqs.find((rfq) => rfq._id === openRfqId) ?? null;
  const batch = batchRfqs.find((rfq) => typeof rfq.bulkBatch === "object")?.bulkBatch;
  const batchTitle =
    (typeof batch === "object" && batch?.title) || batchRfqs[0]?.title || "Bulk RFQ";
  const uploadedAt = batchRfqs[batchRfqs.length - 1]?.createdAt;

  const latestResponseAt = (rfqId: string) => {
    const answered = respondedQuotes(quotesByRfq.get(rfqId));
    if (answered.length === 0) return null;
    return answered
      .map((quote) => quote.updatedAt || quote.createdAt)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
  };

  /** One row per product in the batch, as shown in the table. */
  const downloadBatch = () => {
    const rows = batchRfqs.map((rfq) => ({
      Product: productLabel(rfq),
      "RFQ ID": rfq.publicId ?? rfq._id,
      "Quantity requested": rfq.items[0]?.quantity ?? 0,
      "Responses received": respondedQuotes(quotesByRfq.get(rfq._id)).length,
      "Latest response": latestResponseAt(rfq._id) ?? "",
      Status: RFQ_STATUS_LABELS[rfq.status],
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Bulk RFQ");
    XLSX.writeFile(workbook, `bulk-rfq-${params.batchId}.xlsx`);
  };

  const accept = (quote: Quote) => {
    setActionError(null);
    approveQuote.mutate(quote._id, {
      onSuccess: (result) => {
        setOpenRfqId(null);
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
        onError: (error) =>
          setActionError(error instanceof Error ? error.message : "Unable to decline this quote."),
      },
    );
  };

  if (isLoading) {
    return (
      <div>
        <Header title="Bulk RFQ" />
        <div className="space-y-4 p-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-24" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray7">
      <Header title="Bulk RFQ" />
      <main className="mx-auto max-w-[1160px] space-y-4 p-4 md:space-y-5 md:p-6">
        <Button
          title="Back to RFQ details"
          variant="secondaryLight"
          size="sm"
          iconLeft={<ArrowLeft size={16} />}
          onClick={() => router.push("/dashboard/buyer/rfqs")}
          className="!w-auto"
        />

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray1 md:text-2xl">{batchTitle}</h1>
            <p className="mt-2 text-sm text-gray2">
              {batchRfqs.length} product{batchRfqs.length === 1 ? "" : "s"} · Uploaded on{" "}
              {shortDate(uploadedAt)}
            </p>
          </div>
          <Button
            title="Download RFQ"
            variant="secondaryLight"
            size="md"
            iconLeft={<Download size={17} />}
            disabled={batchRfqs.length === 0}
            onClick={downloadBatch}
            className="!w-auto"
          />
        </div>

        <section className="flex gap-3 rounded-lg border-l-4 border-primary bg-primary-light/50 p-4">
          <Info size={20} className="mt-0.5 shrink-0 text-primary" />
          <div>
            <p className="font-medium text-gray1">RFQ overview</p>
            <p className="mt-1 text-sm leading-6 text-gray2">
              This bulk RFQ contains multiple products awaiting distributor quotations. Select a
              product below to compare distributor responses, review pricing, and proceed with
              selection.
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-gray5 bg-white p-4 md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg font-semibold text-gray1">Product quotations</h2>
            <label className="relative md:w-[280px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray3" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search product"
                aria-label="Search product"
                className="h-11 w-full rounded-lg border border-gray5 pl-9 pr-3 text-sm text-gray1 placeholder:text-gray3"
              />
            </label>
          </div>

          {batchRfqs.length === 0 ? (
            <EmptyState
              title="No products in this batch"
              description="This bulk request has no rows, or it belongs to another account."
            />
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray3">No product matches “{search}”.</p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="mt-5 hidden overflow-x-auto md:block">
                <table className="w-full min-w-[880px] text-left">
                  <thead className="border-b border-gray6 text-xs uppercase tracking-wide text-gray3">
                    <tr>
                      <th className="pb-4 pr-4 font-medium">Product</th>
                      <th className="pb-4 pr-4 font-medium">Quantity requested</th>
                      <th className="pb-4 pr-4 font-medium">Responses received</th>
                      <th className="pb-4 pr-4 font-medium">Latest response</th>
                      <th className="pb-4 pr-4 font-medium">Status</th>
                      <th className="pb-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRfqs.map((rfq) => {
                      const answered = respondedQuotes(quotesByRfq.get(rfq._id));
                      return (
                        <tr key={rfq._id} className="border-b border-gray6 text-sm last:border-0">
                          <td className="py-4 pr-4">
                            <span className="block font-medium text-gray1">{productLabel(rfq)}</span>
                            <span className="block text-xs text-gray3">
                              ID: {rfq.publicId ?? rfq._id}
                            </span>
                          </td>
                          <td className="py-4 pr-4 text-gray1">
                            {rfq.items[0]?.quantity ?? 0} unit
                            {(rfq.items[0]?.quantity ?? 0) === 1 ? "" : "s"}
                          </td>
                          <td className="py-4 pr-4 text-gray1">{answered.length}</td>
                          <td className="py-4 pr-4 text-gray2">
                            {relativeTime(latestResponseAt(rfq._id))}
                          </td>
                          <td className={`py-4 pr-4 font-medium ${statusClass(rfq)}`}>
                            {RFQ_STATUS_LABELS[rfq.status]}
                          </td>
                          <td className="py-4">
                            <button
                              type="button"
                              onClick={() => {
                                setActionError(null);
                                setOpenRfqId(rfq._id);
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
                {pageRfqs.map((rfq) => {
                  const answered = respondedQuotes(quotesByRfq.get(rfq._id));
                  const expanded = expandedRfqId === rfq._id;
                  return (
                    <article key={rfq._id} className="rounded-xl border border-gray5">
                      <button
                        type="button"
                        aria-expanded={expanded}
                        onClick={() => setExpandedRfqId(expanded ? null : rfq._id)}
                        className="flex w-full items-center justify-between gap-3 p-4 text-left"
                      >
                        <span className="min-w-0 truncate font-medium text-gray1">
                          {productLabel(rfq)}
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
                              <dt className="text-xs uppercase tracking-wide text-gray3">
                                Product ID
                              </dt>
                              <dd className="mt-1 truncate text-gray1">
                                {rfq.publicId ?? rfq._id}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs uppercase tracking-wide text-gray3">
                                Qty requested
                              </dt>
                              <dd className="mt-1 text-gray1">{rfq.items[0]?.quantity ?? 0}</dd>
                            </div>
                            <div>
                              <dt className="text-xs uppercase tracking-wide text-gray3">
                                Responses
                              </dt>
                              <dd className="mt-1 text-gray1">{answered.length}</dd>
                            </div>
                            <div>
                              <dt className="text-xs uppercase tracking-wide text-gray3">
                                Latest response
                              </dt>
                              <dd className="mt-1 text-gray1">
                                {relativeTime(latestResponseAt(rfq._id))}
                              </dd>
                            </div>
                            <div className="col-span-2">
                              <dt className="text-xs uppercase tracking-wide text-gray3">Status</dt>
                              <dd className={`mt-1 font-medium ${statusClass(rfq)}`}>
                                {RFQ_STATUS_LABELS[rfq.status]}
                              </dd>
                            </div>
                          </dl>
                          <Button
                            title="View responses"
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setActionError(null);
                              setOpenRfqId(rfq._id);
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
                  {filtered.length} product{filtered.length === 1 ? "" : "s"}
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
      </main>

      <ProductResponsesModal
        open={Boolean(openRfq)}
        rfq={openRfq}
        quotes={openRfq ? quotesByRfq.get(openRfq._id) ?? [] : []}
        onClose={() => setOpenRfqId(null)}
        onAccept={accept}
        onDecline={decline}
        isAccepting={approveQuote.isPending}
        isDeclining={rejectQuote.isPending}
        error={actionError}
      />
    </div>
  );
}
