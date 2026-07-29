"use client";

/**
 * Full detail of one distributor quote, opened from the single-quote response
 * table and from the bulk product-responses list.
 *
 * The financial summary is built from the quote's own line items (unit price ×
 * quantity per available line) and its `totalPrice`. The Figma also shows
 * itemised installation/training fees and a stock-status chip; the quote
 * contract carries neither, so those rows are absent instead of stubbed.
 */

import { CheckCircle2, Download, FileText, Info, X } from "lucide-react";

import { Button } from "@/components/base";
import type { Quote, Rfq } from "@/types/rfq";
import { QUOTE_STATUS_LABELS } from "@/types/rfq";
import {
  dateTime,
  distributorEmail,
  distributorName,
  lineFor,
  money,
  offerKind,
  OFFER_KIND_CLASSES,
  OFFER_KIND_LABELS,
  quoteTotal,
} from "./quotePresentation";

interface QuoteDetailModalProps {
  open: boolean;
  quote: Quote | null;
  rfq: Rfq;
  onClose: () => void;
  onAccept?: (quote: Quote) => void;
  onDecline?: (quote: Quote) => void;
  isAccepting?: boolean;
  isDeclining?: boolean;
  error?: string | null;
}

export default function QuoteDetailModal({
  open,
  quote,
  rfq,
  onClose,
  onAccept,
  onDecline,
  isAccepting = false,
  isDeclining = false,
  error = null,
}: QuoteDetailModalProps) {
  if (!open || !quote) return null;

  const decidable = quote.status === "quoted";
  const total = quoteTotal(quote);
  const documents = [
    ...(quote.images ?? []).map((file) => ({ ...file, kind: "Product image" })),
    ...(quote.catalogue ? [{ ...quote.catalogue, kind: "Catalogue" }] : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex bg-gray1/40 p-0 md:items-center md:justify-center md:p-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`Quote from ${distributorName(quote)}`}
        className="flex h-full w-full max-w-3xl flex-col overflow-hidden bg-white shadow-xl md:h-auto md:max-h-[92vh] md:rounded-2xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-gray5 px-5 py-4 md:px-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold text-gray1 md:text-xl">
                {distributorName(quote)}
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-light px-2.5 py-1 text-xs font-medium text-primary">
                <CheckCircle2 size={13} />
                {QUOTE_STATUS_LABELS[quote.status]}
              </span>
            </div>
            <p className="mt-1 truncate text-sm text-gray3">
              {distributorEmail(quote) ? `${distributorEmail(quote)} · ` : ""}
              Submitted {dateTime(quote.updatedAt || quote.createdAt)}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close quote detail"
            onClick={onClose}
            className="rounded p-2 text-gray2 hover:bg-gray7"
          >
            <X size={22} />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-5 md:p-6">
          {rfq.items.map((item, index) => {
            const line = lineFor(quote, index);
            const kind = offerKind(quote, rfq, index);
            return (
              <div key={index} className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-gray7 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray3">
                    Requested product
                  </p>
                  <p className="mt-2 text-lg font-semibold text-gray1">{item.productName}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-white px-2.5 py-1 text-gray2">
                      Qty: {item.quantity}
                    </span>
                    {item.model ? (
                      <span className="rounded-full bg-white px-2.5 py-1 text-gray2">
                        Model: {item.model}
                      </span>
                    ) : null}
                    {item.brand ? (
                      <span className="rounded-full bg-white px-2.5 py-1 text-gray2">
                        Brand: {item.brand}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-xl border border-primary/30 bg-primary-light/40 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-primary">
                    Offered product
                  </p>
                  <p className="mt-2 text-lg font-semibold text-gray1">
                    {line?.availableModel || item.productName}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className={`rounded-full bg-white px-2.5 py-1 font-medium ${OFFER_KIND_CLASSES[kind]}`}>
                      {OFFER_KIND_LABELS[kind]}
                    </span>
                    {line?.available && line.quantity != null ? (
                      <span className="rounded-full bg-white px-2.5 py-1 text-gray2">
                        Supplying: {line.quantity}
                      </span>
                    ) : null}
                  </div>
                  {line?.notes ? <p className="mt-3 text-sm text-gray2">{line.notes}</p> : null}
                </div>
              </div>
            );
          })}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="overflow-hidden rounded-xl border border-gray5">
              <p className="bg-primary-light px-4 py-3 text-xs font-medium uppercase tracking-wide text-primary">
                Financial summary
              </p>
              <dl className="divide-y divide-gray6">
                {rfq.items.map((item, index) => {
                  const line = lineFor(quote, index);
                  if (!line?.available) return null;
                  return (
                    <div key={index} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                      <dt className="min-w-0 truncate text-gray2">
                        {item.productName}
                        <span className="text-gray3"> (×{line.quantity ?? item.quantity})</span>
                      </dt>
                      <dd className="shrink-0 font-medium text-gray1">
                        {money((line.pricePerUnit ?? 0) * (line.quantity ?? item.quantity))}
                      </dd>
                    </div>
                  );
                })}
              </dl>
              <div className="flex items-center justify-between gap-3 bg-gray1 px-4 py-3 text-sm text-white">
                <span className="font-medium">Total quote</span>
                <span className="font-semibold">{money(total)}</span>
              </div>
            </div>

            <div className="rounded-xl border border-gray5 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray3">
                Logistics &amp; support
              </p>
              <dl className="mt-3 space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-gray3">Warranty</dt>
                  <dd className="mt-0.5 font-medium text-gray1">{quote.warranty || "Not stated"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray3">Delivery timeline requested</dt>
                  <dd className="mt-0.5 font-medium text-gray1">
                    {rfq.deliveryTimeline || "Not specified"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray3">Lines quoted</dt>
                  <dd className="mt-0.5 font-medium text-gray1">
                    {quote.items.filter((line) => line.available).length} of {rfq.items.length}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {quote.notes ? (
            <div className="rounded-xl bg-primary-light/50 p-4">
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary">
                <Info size={14} /> Distributor notes
              </p>
              <p className="mt-2 text-sm leading-6 text-gray2">{quote.notes}</p>
            </div>
          ) : null}

          {documents.length ? (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray3">Documentation</p>
              <ul className="mt-3 space-y-3">
                {documents.map((file) => (
                  <li key={file.cloudinary_id}>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-3 rounded-xl border border-gray5 px-4 py-3 hover:bg-gray7"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <FileText size={20} className="shrink-0 text-primary" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-gray1">
                            {file.originalName || file.kind}
                          </span>
                          <span className="block text-xs text-gray3">{file.kind}</span>
                        </span>
                      </span>
                      <Download size={18} className="shrink-0 text-gray3" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </div>

        {decidable && (onAccept || onDecline) ? (
          <footer className="grid gap-3 border-t border-gray5 p-5 sm:grid-cols-2">
            {onDecline ? (
              <Button
                title={isDeclining ? "Declining..." : "Decline quote"}
                variant="secondaryLight"
                size="md"
                isBusy={isDeclining}
                disabled={isAccepting}
                onClick={() => onDecline(quote)}
                className="!border-danger !text-danger hover:!bg-danger/5"
              />
            ) : null}
            {onAccept ? (
              <Button
                title={isAccepting ? "Accepting..." : "Accept quote"}
                variant="primary"
                size="md"
                isBusy={isAccepting}
                disabled={isDeclining}
                onClick={() => onAccept(quote)}
              />
            ) : null}
          </footer>
        ) : null}
      </section>
    </div>
  );
}
