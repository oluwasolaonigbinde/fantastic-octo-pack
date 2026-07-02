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

/**
 * Immutable snapshot of the delivery address, copied from the buyer's address
 * book at order time (the API no longer returns a plain string here).
 */
export interface DeliveryAddressSnapshot {
  address: string;
  city: string;
  state: string;
  country: string;
  phone?: string | null;
}

/**
 * Logistics stages a distributor advances a paid order through
 * (POST /orders/:id/fulfillment). `installed` is only valid when the order
 * `requiresInstallation`.
 */
export type FulfillmentStage = "received" | "delivered" | "installed";

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
  /** Immutable snapshot copied from the buyer's address book (object, not a string). */
  deliveryAddress?: DeliveryAddressSnapshot | null;
  /** Id of the source profile address the snapshot was copied from. */
  deliveryAddressId?: string | null;
  /** Whether installation is required before completion (snapshot from the product). */
  requiresInstallation?: boolean | null;
  notes?: string;
  /** Gateway reference, populated once payment is initiated. */
  paymentReference?: string;
  /** Logistics stage timestamps — presence indicates the stage is complete. */
  receivedByDistributorAt?: string | null;
  deliveredAt?: string | null;
  installedAt?: string | null;
  receivedByBuyerAt?: string | null;
  /** @deprecated Legacy alias for `deliveredAt`; not returned by the live API. */
  fulfilledAt?: string;
  /** @deprecated Legacy alias for `receivedByBuyerAt`; not returned by the live API. */
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

/**
 * Render a delivery-address snapshot as a single line. Tolerates the legacy
 * string shape and missing values, returning "" when nothing is set.
 */
export function formatDeliveryAddress(
  value: Order["deliveryAddress"] | string | null | undefined,
): string {
  if (!value) {
    return "";
  }
  if (typeof value === "string") {
    return value.trim();
  }
  return [value.address, value.city, value.state, value.country]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
}

/**
 * Order statuses that mean escrow has been funded (the order is paid for).
 * Besides the money-in states, the backend advances `status` through the
 * fulfillment stages (`received → delivered → installed`); reaching any of those
 * also implies the order was paid.
 */
export const PAID_ORDER_STATUSES = [
  "paid",
  "processing",
  "fulfilled",
  "completed",
  "received",
  "delivered",
  "installed",
  "shipped",
];

/** True when the order's status means payment/escrow has been funded. */
export function isPaidOrderStatus(status?: string | null): boolean {
  return Boolean(status) && PAID_ORDER_STATUSES.includes(status as string);
}

/**
 * How far a paid order has progressed through the logistics stages. A stage is
 * complete when EITHER its per-stage timestamp is present OR the order's status
 * has reached (or passed) that stage — the backend drives progress through
 * `status` (`received → delivered → installed`), with the timestamps as a
 * fallback. A `completed` order has every stage behind it.
 */
export interface FulfillmentProgress {
  received: boolean;
  delivered: boolean;
  installed: boolean;
}

// How far each status string implies the order has progressed: 1 = received,
// 2 = delivered, 3 = the final stage reached (installed / fully fulfilled).
const FULFILLMENT_STATUS_RANK: Record<string, number> = {
  received: 1,
  shipped: 1,
  delivered: 2,
  installed: 3,
  fulfilled: 3,
  completed: 3,
};

export function getFulfillmentProgress(
  order: Pick<
    Order,
    | "status"
    | "receivedByDistributorAt"
    | "deliveredAt"
    | "installedAt"
  >,
): FulfillmentProgress {
  const isCompleted = order.status === "completed";
  const rank = FULFILLMENT_STATUS_RANK[order.status ?? ""] ?? 0;
  return {
    received: Boolean(order.receivedByDistributorAt) || rank >= 1 || isCompleted,
    delivered: Boolean(order.deliveredAt) || rank >= 2 || isCompleted,
    installed: Boolean(order.installedAt) || rank >= 3 || isCompleted,
  };
}

/**
 * The next fulfillment stage a distributor should advance a paid order to,
 * derived from the order's status and per-stage timestamps. Returns `null` when
 * the order has reached its final required stage (awaiting buyer confirmation).
 */
export function getNextFulfillmentStage(
  order: Pick<
    Order,
    | "status"
    | "receivedByDistributorAt"
    | "deliveredAt"
    | "installedAt"
    | "requiresInstallation"
  >,
): FulfillmentStage | null {
  const progress = getFulfillmentProgress(order);
  if (!progress.received) {
    return "received";
  }
  if (!progress.delivered) {
    return "delivered";
  }
  if (order.requiresInstallation && !progress.installed) {
    return "installed";
  }
  return null;
}

/**
 * True when the distributor has finished every required fulfillment stage but
 * the buyer hasn't confirmed receipt yet — it's the buyer who confirms delivery,
 * so the order sits in this "delivery in process" state until they do.
 */
export function isAwaitingBuyerConfirmation(
  order: Pick<
    Order,
    | "status"
    | "receivedByDistributorAt"
    | "deliveredAt"
    | "installedAt"
    | "requiresInstallation"
  >,
): boolean {
  if (order.status === "completed") return false;
  if (!isPaidOrderStatus(order.status)) return false;
  return getNextFulfillmentStage(order) === null;
}

/**
 * Canonical order progress milestones, shared by every progress bar (buyer +
 * distributor, desktop + mobile) so they stay in lockstep. The fulfillment
 * stages map 1:1 to `Received → Delivered → Installed`. The `Installed`
 * milestone is only present when the order requires installation.
 */
export function getOrderMilestones(
  requiresInstallation?: boolean | null,
): string[] {
  return requiresInstallation
    ? ["Create order", "Payment", "Received", "Delivered", "Installed", "Completed"]
    : ["Create order", "Payment", "Received", "Delivered", "Completed"];
}

/**
 * How many canonical milestones are complete, derived from the order's status
 * and per-stage timestamps. The logistics stages advance ONE AT A TIME, driven
 * by their per-stage timestamps, so the stepper never jumps ahead of the
 * distributor's actions (marking "received" lights only "Received", not
 * "Delivered"). A `completed` order has every stage behind it, so it lights them
 * all even if an individual timestamp is missing.
 */
export function getActiveMilestoneCount(
  order: Pick<
    Order,
    | "status"
    | "receivedByDistributorAt"
    | "deliveredAt"
    | "installedAt"
    | "requiresInstallation"
  >,
  requiresInstallation = Boolean(order.requiresInstallation),
): number {
  const isCompleted = order.status === "completed";
  const progress = getFulfillmentProgress(order);

  let count = 1; // Create order.
  // Payment lights once the order is paid — or once any fulfillment progress
  // exists, since you can't be received/delivered without having paid.
  if (isPaidOrderStatus(order.status) || progress.received) count += 1; // Payment.
  if (progress.received) count += 1; // Received.
  if (progress.delivered) count += 1; // Delivered.
  if (requiresInstallation && progress.installed) count += 1; // Installed.
  if (isCompleted) count += 1; // Completed.
  return count;
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
  received: "Received",
  installed: "Installed",
  shipped: "Shipped",
  delivered: "Delivered",
};
