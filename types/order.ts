import type { UserRef, ProductRef } from "./rfq";

/**
 * Backend order lifecycle (single source of truth — there is no separate
 * `paymentStatus` field). The money-in / in-escrow states are
 * `paid | processing | fulfilled | completed`. `completed` = escrow released to
 * the distributor; `closed` = buyer refunded after a dispute.
 *
 * NOTE: `shipped` / `delivered` are NOT returned by the API. They remain in the
 * union only because some legacy admin/dashboard screens still reference them;
 * new code should use the real states below.
 */
export type OrderStatus =
  | "draft_pending_buyer"
  | "created_pending_payment"
  | "payment_initiated"
  | "payment_failed"
  | "paid"
  | "processing"
  | "fulfilled"
  | "completed"
  | "closed"
  | "cancelled_pre_payment"
  // legacy-only, never emitted by the live API:
  | "shipped"
  | "delivered";

export interface OrderLineItem {
  product: string | ProductRef;
  productName: string;
  quantity: number;
  notes?: string;
}

export interface Order {
  _id: string;
  buyer: string | UserRef;
  seller: string | UserRef;
  rfq?: string;
  quote?: string;
  /**
   * The live API returns a FLAT order (`product`, `productName`, `quantity` at
   * the top level). `items[]` is kept optional for legacy/demo data only.
   */
  product?: string | ProductRef;
  productName?: string;
  quantity?: number;
  items?: OrderLineItem[];
  totalPrice: number;
  deliveryAddress?: string;
  notes?: string;
  /** Gateway reference, populated once payment is initiated. */
  paymentReference?: string;
  /** When the distributor marked the order fulfilled (delivered). */
  fulfilledAt?: string;
  /** When the buyer confirmed receipt (or the auto-receive job did). */
  receivedAt?: string;
  autoReceived?: boolean;
  /** Platform fee withheld on release, in kobo. */
  platformFee?: number;
  /** Amount credited to the distributor on release, in kobo. */
  netPayout?: number;
  /** Set while the order is frozen by an open dispute. */
  activeDisputeId?: string;
  /** Not returned by the live API — legacy/demo only. */
  proposedDeliveryDate?: string;
  /** Not returned by the live API — legacy/demo only. Use `status` instead. */
  paymentStatus?: string;
  status: OrderStatus;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Request body for POST /orders/on-behalf — a distributor drafts an order for a
 * buyer from inside a conversation. The backend creates a `draft_pending_buyer`
 * order and sends the buyer an `order_proposal` message. Only a single product
 * is supported per call.
 */
export interface OnBehalfOrderPayload {
  buyer: string;
  product: string;
  quantity: number;
  notes?: string;
}

/**
 * Request body for PATCH /orders/:id/draft — the buyer edits a draft order that
 * was created on their behalf before paying (e.g. sets a delivery address).
 */
export interface DraftOrderUpdate {
  quantity?: number;
  notes?: string;
  deliveryAddress?: string;
}

/** Payment rails supported on the order Make Payment screen. */
export type OrderPaymentMethod = "wallet" | "paystack";

/** Request body for POST /orders/:id/pay. */
export interface PayOrderPayload {
  method: OrderPaymentMethod;
  /** Where Paystack should redirect after checkout. Ignored for wallet payments. */
  callbackUrl?: string;
}

/**
 * Result of POST /orders/:id/pay.
 * - Paystack returns a checkout `authorizationUrl` (mirrors wallet top-up).
 * - Wallet payments settle inline and may echo the updated `order`.
 */
export interface OrderPaymentResult {
  authorizationUrl?: string;
  reference?: string;
  order?: Order;
  [key: string]: unknown;
}

/** Aggregated escrow figures for the authenticated user (GET /orders/escrow/summary). */
export interface EscrowSummary {
  currency: string;
  /** Gross funds currently held in escrow (kobo). */
  heldGrossKobo: number;
  /** Net amount expected after platform fees (kobo) — used as the escrow balance. */
  expectedNetKobo: number;
  platformFeePercent: number;
  platformFeeCap: number | null;
  orderCount: number;
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  draft_pending_buyer: "Draft — Awaiting Your Review",
  created_pending_payment: "Pending Payment",
  payment_initiated: "Payment Initiated",
  payment_failed: "Payment Failed",
  paid: "Paid",
  processing: "Processing",
  fulfilled: "Delivered",
  completed: "Completed",
  closed: "Refunded",
  cancelled_pre_payment: "Cancelled",
  shipped: "Shipped",
  delivered: "Delivered",
};
