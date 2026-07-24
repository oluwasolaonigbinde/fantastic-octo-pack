"use client";

/**
 * The responses one product in a bulk batch attracted. Each row in the batch is
 * its own RFQ, so this is that RFQ's quote list — opened from the bulk product
 * table and drilling into the shared `QuoteDetailModal` for a full quote.
 */

import { useState } from "react";
import { ChevronDown, Download, Info, X } from "lucide-react";
import * as XLSX from "xlsx";

import { Button } from "@/components/base";
import type { Quote, Rfq } from "@/types/rfq";
import QuoteDetailModal from "./QuoteDetailModal";
import {
  distributorEmail,
  distributorInitials,
  distributorName,
  money,
  offerKind,
  OFFER_KIND_CLASSES,
  OFFER_KIND_LABELS,
  offeredModel,
  quoteTotal,
  respondedQuotes,
  productLabel,
} from "./quotePresentation";

interface ProductResponsesModalProps {
  open: boolean;
  rfq: Rfq | null;
  quotes: Quote[];
  onClose: () => void;
  onAccept: (quote: Quote) => void;
  onDecline: (quote: Quote) => void;
  isAccepting?: boolean;
  isDeclining?: boolean;
  error?: string | null;
}

export default function ProductResponsesModal({
  open,
  rfq,
  quotes,
  onClose,
  onAccept,
  onDecline,
  isAccepting = false,
  isDeclining = false,
  error = null,
}: ProductResponsesModalProps) {
  const [reviewQuoteId, setReviewQuoteId] = useState<string | null>(null);
  const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null);

  if (!open || !rfq) return null;

  const responded = respondedQuotes(quotes);
  const reviewQuote = quotes.find((quote) => quote._id === reviewQuoteId) ?? null;

  /** Exports what the buyer is looking at — one row per distributor response. */
  const downloadAll = () => {
    const rows = responded.map((quote) => ({
      Distributor: distributorName(quote),
      Email: distributorEmail(quote),
      Response: OFFER_KIND_LABELS[offerKind(quote, rfq)],
      "Model offered": offeredModel(quote, rfq),
      "Unit price": quote.items.find((item) => item.rfqItemIndex === 0)?.pricePerUnit ?? "",
      "Total quote": quoteTotal(quote) ?? "",
      Warranty: quote.warranty ?? "",
      Notes: quote.notes ?? "",
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Responses");
    XLSX.writeFile(workbook, `quotes-${rfq.publicId || rfq._id}.xlsx`);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex bg-gray1/40 p-0 md:items-center md:justify-center md:p-6">
        <section
          role="dialog"
          aria-modal="true"
          aria-label={`Responses for ${productLabel(rfq)}`}
          className="flex h-full w-full max-w-xl flex-col overflow-hidden bg-white shadow-xl md:h-auto md:max-h-[90vh] md:rounded-2xl"
        >
          <header className="flex items-start justify-between gap-3 border-b border-gray5 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-gray1">Product responses</h2>
              <p className="mt-0.5 text-sm text-gray3">
                Review quotes for this bulk procurement request
              </p>
            </div>
            <button
              type="button"
              aria-label="Close product responses"
              onClick={onClose}
              className="rounded p-2 text-gray2 hover:bg-gray7"
            >
              <X size={22} />
            </button>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto bg-gray7/60 p-5">
            <div className="rounded-xl bg-primary-light/60 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray3">
                    Product info
                  </p>
                  <p className="mt-1.5 text-lg font-semibold text-gray1">{productLabel(rfq)}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {rfq.publicId ? (
                      <span className="rounded bg-white px-2 py-1 font-medium text-primary">
                        ID: {rfq.publicId}
                      </span>
                    ) : null}
                    <span className="rounded bg-white px-2 py-1 text-gray2">
                      Qty: {rfq.items[0]?.quantity ?? 0}
                    </span>
                  </div>
                </div>
                <span className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-white">
                  {responded.length} response{responded.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>

            {responded.length === 0 ? (
              <p className="rounded-xl border border-gray5 bg-white p-8 text-center text-sm text-gray3">
                No distributor has answered this product yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {responded.map((quote) => {
                  const kind = offerKind(quote, rfq);
                  const unitPrice = quote.items.find((item) => item.rfqItemIndex === 0)?.pricePerUnit;
                  const expanded = expandedQuoteId === quote._id;
                  return (
                    <li key={quote._id} className="rounded-xl border border-gray5 bg-white">
                      {/* Desktop row */}
                      <div className="hidden items-center gap-3 p-4 md:flex">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-light text-xs font-semibold text-primary">
                          {distributorInitials(quote)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-gray1">
                            {distributorName(quote)}
                          </span>
                          <span className="block truncate text-xs text-gray3">
                            {distributorEmail(quote)}
                          </span>
                        </span>
                        <span className="w-32 shrink-0">
                          <span className="block text-sm font-medium text-gray1">
                            {money(unitPrice)}
                          </span>
                          <span className="block text-xs text-gray3">Unit price</span>
                        </span>
                        <span className={`w-32 shrink-0 text-sm font-medium ${OFFER_KIND_CLASSES[kind]}`}>
                          {OFFER_KIND_LABELS[kind]}
                        </span>
                        <button
                          type="button"
                          onClick={() => setReviewQuoteId(quote._id)}
                          className="shrink-0 text-sm font-medium text-primary hover:underline"
                        >
                          Review
                        </button>
                      </div>

                      {/* Mobile accordion */}
                      <div className="md:hidden">
                        <button
                          type="button"
                          aria-expanded={expanded}
                          onClick={() => setExpandedQuoteId(expanded ? null : quote._id)}
                          className="flex w-full items-center justify-between gap-3 p-4 text-left"
                        >
                          <span className="flex min-w-0 items-center gap-2.5">
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
                          </span>
                          <ChevronDown
                            size={20}
                            className={`shrink-0 text-gray3 transition-transform ${expanded ? "rotate-180" : ""}`}
                          />
                        </button>
                        {expanded ? (
                          <div className="space-y-3 border-t border-gray6 p-4">
                            <dl className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <dt className="text-xs uppercase tracking-wide text-gray3">
                                  Unit price
                                </dt>
                                <dd className="mt-1 text-gray1">{money(unitPrice)}</dd>
                              </div>
                              <div>
                                <dt className="text-xs uppercase tracking-wide text-gray3">
                                  Total quote
                                </dt>
                                <dd className="mt-1 font-medium text-gray1">
                                  {money(quoteTotal(quote))}
                                </dd>
                              </div>
                              <div className="col-span-2">
                                <dt className="text-xs uppercase tracking-wide text-gray3">
                                  Response
                                </dt>
                                <dd className={`mt-1 font-medium ${OFFER_KIND_CLASSES[kind]}`}>
                                  {OFFER_KIND_LABELS[kind]}
                                </dd>
                              </div>
                            </dl>
                            <Button
                              title="Review quote"
                              variant="primary"
                              size="sm"
                              onClick={() => setReviewQuoteId(quote._id)}
                              className="w-full"
                            />
                          </div>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {error ? <p className="text-sm text-danger">{error}</p> : null}
          </div>

          <footer className="space-y-2 border-t border-gray5 bg-primary-light/40 p-5">
            <Button
              title="Download all quotes"
              variant="secondaryLight"
              size="md"
              iconLeft={<Download size={17} />}
              disabled={responded.length === 0}
              onClick={downloadAll}
              className="w-full"
            />
            <p className="flex items-center justify-center gap-1.5 text-xs text-gray3">
              <Info size={13} />
              Prices are as submitted by each distributor.
            </p>
          </footer>
        </section>
      </div>

      <QuoteDetailModal
        open={Boolean(reviewQuote)}
        quote={reviewQuote}
        rfq={rfq}
        onClose={() => setReviewQuoteId(null)}
        onAccept={onAccept}
        onDecline={onDecline}
        isAccepting={isAccepting}
        isDeclining={isDeclining}
        error={error}
      />
    </>
  );
}
