/**
 * Presentation helpers shared by the buyer's single-quote and bulk-quote views.
 *
 * Everything here is derived from what `GET /rfqs/:id` actually returns — the
 * RFQ line items plus the distributor quotes. Where the Figma shows a field the
 * quote contract has no home for (stock status, per-quote delivery time,
 * itemised installation/training fees) the value is omitted rather than
 * invented.
 */

import type { Quote, QuoteLineItem, Rfq, UserRef } from "@/types/rfq";
import { getPartyDisplayName } from "@/utils/partyDisplayName";

/** Statuses that mean the distributor has actually come back to the buyer. */
export const RESPONDED_QUOTE_STATUSES: Quote["status"][] = [
  "quoted",
  "unavailable",
  "selected_for_order",
  "not_selected",
  "rejected_by_buyer",
];

export const hasResponded = (quote: Quote) =>
  RESPONDED_QUOTE_STATUSES.includes(quote.status);

export const respondedQuotes = (quotes: Quote[] = []) => quotes.filter(hasResponded);

export const money = (value?: number | null) =>
  value == null
    ? "--"
    : new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 0,
      }).format(value);

export const shortDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "--";

export const dateTime = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "--";

/** "5 mins ago" style stamp for the bulk table's latest-response column. */
export const relativeTime = (value?: string | null) => {
  if (!value) return "--";
  const elapsed = Date.now() - new Date(value).getTime();
  if (Number.isNaN(elapsed)) return "--";
  const minutes = Math.round(elapsed / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

/**
 * The quote read populates the distributor with name and email only — there is
 * no business-name field on that projection — so the personal name is the
 * fallback rather than a placeholder brand.
 */
export const distributorName = (quote: Quote) => {
  if (!quote.distributor || typeof quote.distributor === "string") return "Verified supplier";
  const distributor = quote.distributor as UserRef;
  return getPartyDisplayName(distributor, "Verified supplier");
};

export const distributorEmail = (quote: Quote) =>
  typeof quote.distributor === "string" ? "" : quote.distributor?.email ?? "";

export const distributorId = (quote: Quote) =>
  typeof quote.distributor === "string" ? quote.distributor : quote.distributor?._id;

export const distributorInitials = (quote: Quote) =>
  distributorName(quote)
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

/** The quote's response to one RFQ line, or undefined if it did not answer it. */
export const lineFor = (quote: Quote, rfqItemIndex: number): QuoteLineItem | undefined =>
  quote.items.find((item) => item.rfqItemIndex === rfqItemIndex);

export type OfferKind = "exact" | "alternative" | "unavailable" | "pending";

/**
 * What the distributor offered against the requested line. "Alternative" means
 * they named a model other than the one the buyer asked for; with no model on
 * the request there is nothing to differ from, so an available line is exact.
 */
export const offerKind = (quote: Quote, rfq: Rfq, rfqItemIndex = 0): OfferKind => {
  if (!hasResponded(quote)) return "pending";
  const line = lineFor(quote, rfqItemIndex);
  if (!line || !line.available) return "unavailable";
  const requested = rfq.items[rfqItemIndex]?.model?.trim().toLowerCase();
  const offered = line.availableModel?.trim().toLowerCase();
  if (!requested || !offered) return "exact";
  return requested === offered ? "exact" : "alternative";
};

export const OFFER_KIND_LABELS: Record<OfferKind, string> = {
  exact: "Exact model",
  alternative: "Alternative model",
  unavailable: "Not available",
  pending: "Awaiting response",
};

export const OFFER_KIND_CLASSES: Record<OfferKind, string> = {
  exact: "text-success",
  alternative: "text-primary",
  unavailable: "text-danger",
  pending: "text-gray3",
};

/** Model the distributor offered, falling back to what the buyer asked for. */
export const offeredModel = (quote: Quote, rfq: Rfq, rfqItemIndex = 0) =>
  lineFor(quote, rfqItemIndex)?.availableModel || rfq.items[rfqItemIndex]?.model || "--";

/** The quote's own total when priced, else the sum of its available lines. */
export const quoteTotal = (quote: Quote) => {
  if (quote.totalPrice != null) return quote.totalPrice;
  const total = quote.items
    .filter((item) => item.available)
    .reduce((sum, item) => sum + (item.pricePerUnit ?? 0) * (item.quantity ?? 0), 0);
  return total > 0 ? total : null;
};

export const rfqTitle = (rfq: Rfq) =>
  rfq.title || rfq.items[0]?.productName || "Sourcing request";

/**
 * Product name for one row of a bulk batch. Every RFQ the batch created carries
 * the *batch* title, so the line item is the only place the product name lives.
 */
export const productLabel = (rfq: Rfq) =>
  rfq.items[0]?.productName || rfq.title || "Product";

export const deliveryAddressLine = (rfq: Rfq) => {
  if (rfq.deliveryAddress) {
    return [
      rfq.deliveryAddress.address,
      rfq.deliveryAddress.city,
      rfq.deliveryAddress.state,
      rfq.deliveryAddress.country,
    ]
      .filter(Boolean)
      .join(", ");
  }
  return rfq.deliveryLocation || "No delivery address provided";
};

/** Batch id on an RFQ regardless of whether the backend populated it. */
export const batchIdOf = (rfq: Rfq) =>
  typeof rfq.bulkBatch === "string" ? rfq.bulkBatch : rfq.bulkBatch?._id;
