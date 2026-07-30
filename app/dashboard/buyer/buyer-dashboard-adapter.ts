"use client";

import type { Conversation } from "@/types/messaging";
import { getOrderReference } from "@/types/order";
import type { Order, OrderStatus, OrderSummary } from "@/types/order";
import type { Quote, Rfq, UserRef } from "@/types/rfq";
import {
  ServiceRequestStatus,
  type ServiceRequestData,
  type ServiceRequestStatusCounts,
} from "@/types/service-request";
import type { Wallet } from "@/types/wallet";
import { koboToNaira } from "@/lib/wallet-format";
import { getPartyDisplayName } from "@/utils/partyDisplayName";

/** Number of buckets the spend chart plots across the current month. */
const SPEND_BUCKET_COUNT = 15;

/**
 * Client-side derivation used only when `GET /orders/summary` is unavailable.
 * These must stay in step with the backend's own status list — `processing`,
 * `shipped` and `fulfilled` are legacy values the live API never emits, so
 * matching on them counted nothing.
 */
const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  "created_pending_payment",
  "payment_initiated",
  "paid",
  "received",
  "delivered",
  "installed",
];
/**
 * Approximates the backend's `awaitingBuyerConfirmation`. The server also knows
 * whether an order `requiresInstallation` (a delivered order that still needs
 * installing is NOT awaiting confirmation); the client does not, so prefer the
 * summary whenever it is present.
 */
const CONFIRMATION_ORDER_STATUSES: OrderStatus[] = ["delivered", "installed"];

export type BuyerDashboardActivityKind =
  | "quote"
  | "order"
  | "payment"
  | "message"
  | "service_request";

export interface BuyerDashboardActivity {
  id: string;
  kind: BuyerDashboardActivityKind;
  message: string;
  relativeTime: string;
  timestamp: string;
  href: string;
}

/**
 * Every figure on this model is either measured from a live API response or
 * `null`. There are deliberately no placeholder values: a card with nothing
 * behind it renders a dash, so the buyer can never mistake a stand-in for a
 * real balance, count, or amount.
 */
export interface BuyerDashboardModel {
  /** Spendable wallet balance in naira, from `GET /wallets/me`. */
  balance: number | null;
  ordersNeedConfirmation: number | null;
  activeOrdersCard: number | null;
  engineerRequests: number | null;
  activeOrdersTotal: number | null;
  spendThisMonth: number | null;
  ordersThisMonth: number | null;
  averageOrderValue: number | null;
  /** Empty when the buyer has no orders in the current month. */
  spendSeries: Array<{ label: string; value: number }>;
  /** Empty when nothing has happened yet — never padded. */
  activities: BuyerDashboardActivity[];
}

interface BuildBuyerDashboardModelInput {
  orders: Order[] | null;
  /**
   * `GET /orders/summary`. Authoritative for the order counters and spend
   * figures — it counts every order the buyer has, not just the page that was
   * fetched, and applies the backend's own status rules. The client-side
   * derivation from `orders` remains as the fallback.
   */
  orderSummary?: OrderSummary | null;
  /** `GET /wallets/me`. `null`/absent while loading or on failure. */
  wallet?: Wallet | null;
  serviceRequests?: ServiceRequestData[];
  serviceRequestStatusCounts?: ServiceRequestStatusCounts | null;
  quotes: Quote[] | null;
  conversations: Conversation[] | null;
  now?: Date;
}

const formatPlainMoney = (amount: number) =>
  `₦${new Intl.NumberFormat("en-NG", {
    maximumFractionDigits: 0,
  }).format(amount)}`;

const parseDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isSameMonth = (date: Date, now: Date) =>
  date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();

const getDistributorName = (distributor: string | UserRef): string => {
  if (typeof distributor !== "object" || !distributor) return "Distributor";
  return getPartyDisplayName(distributor, "Distributor");
};

const getRfqProductName = (rfq: string | Rfq): string => {
  if (typeof rfq !== "object" || !rfq) return "equipment request";
  return (
    rfq.items?.[0]?.productName?.trim() ||
    rfq.title?.trim() ||
    "equipment request"
  );
};

const getRfqId = (rfq: string | Rfq): string | null => {
  if (!rfq) return null;
  return typeof rfq === "object" ? rfq._id : rfq;
};

const formatRelativeTime = (value: string, now: Date): string => {
  const timestamp = parseDate(value);
  if (!timestamp) return "Recently";

  const diffMs = now.getTime() - timestamp.getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60_000));
  if (minutes < 60) {
    return `${minutes}min ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    timestamp.getFullYear() === yesterday.getFullYear() &&
    timestamp.getMonth() === yesterday.getMonth() &&
    timestamp.getDate() === yesterday.getDate();

  if (isYesterday) {
    return `Yesterday ${timestamp.toLocaleTimeString("en-NG", {
      hour: "numeric",
      minute: "2-digit",
    })}`;
  }

  return timestamp.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
  });
};

/**
 * Buckets this month's real orders across the month by creation date. Returns
 * an empty series when the buyer has no orders this month — the chart renders
 * an empty state instead of an invented trend line.
 */
const buildSpendSeriesFromOrders = (orders: Order[], now: Date) => {
  const monthOrders = orders.filter((order) => {
    const createdAt = parseDate(order.createdAt);
    return createdAt ? isSameMonth(createdAt, now) : false;
  });

  if (monthOrders.length === 0) {
    return [];
  }

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const buckets = Array.from({ length: SPEND_BUCKET_COUNT }, (_, index) => ({
    label: `P${index + 1}`,
    value: 0,
  }));

  monthOrders.forEach((order) => {
    const createdAt = parseDate(order.createdAt);
    if (!createdAt) return;
    const progress = (createdAt.getDate() - 1) / Math.max(daysInMonth - 1, 1);
    const bucketIndex = Math.min(
      SPEND_BUCKET_COUNT - 1,
      Math.max(0, Math.floor(progress * SPEND_BUCKET_COUNT)),
    );
    buckets[bucketIndex].value += order.totalPrice || 0;
  });

  return buckets;
};

const buildActivities = (
  orders: Order[] | null,
  quotes: Quote[] | null,
  conversations: Conversation[] | null,
  serviceRequests: ServiceRequestData[] | undefined,
  now: Date,
) => {
  const priorityItems: BuyerDashboardActivity[] = [];
  const secondaryItems: BuyerDashboardActivity[] = [];

  if (quotes) {
    const sortedQuotes = [...quotes].sort((a, b) => {
      const left = parseDate(a.updatedAt)?.getTime() ?? 0;
      const right = parseDate(b.updatedAt)?.getTime() ?? 0;
      return right - left;
    });

    const latestResponse = sortedQuotes.find(
      (quote) => quote.status === "quoted" || quote.status === "selected_for_order",
    );
    if (latestResponse) {
      priorityItems.push({
        id: `quote-response-${latestResponse._id}`,
        kind: "quote",
        message: `Distributor ${getDistributorName(latestResponse.distributor)} responded to your RFQ for ${getRfqProductName(latestResponse.rfq)}`,
        relativeTime: formatRelativeTime(latestResponse.updatedAt, now),
        timestamp: latestResponse.updatedAt,
        href: "/dashboard/buyer/rfqs",
      });
    }

    const latestQuote = sortedQuotes[0];
    const rfqId = latestQuote ? getRfqId(latestQuote.rfq) : null;
    if (latestQuote && rfqId) {
      priorityItems.push({
        id: `quote-${latestQuote._id}`,
        kind: "quote",
        message: `New quote received for RFQ #${rfqId.slice(-6).toUpperCase()}`,
        relativeTime: formatRelativeTime(latestQuote.createdAt, now),
        timestamp: latestQuote.createdAt,
        href: "/dashboard/buyer/rfqs",
      });
    }
  }

  if (orders) {
    const sortedOrders = [...orders].sort((a, b) => {
      const left = parseDate(a.updatedAt)?.getTime() ?? 0;
      const right = parseDate(b.updatedAt)?.getTime() ?? 0;
      return right - left;
    });

    // Ordered by how newsworthy the state is to the buyer, using the statuses
    // the live API actually emits (received → delivered → installed).
    const recentOrder =
      sortedOrders.find((order) => order.status === "installed") ||
      sortedOrders.find((order) => order.status === "delivered") ||
      sortedOrders.find((order) => order.status === "received") ||
      sortedOrders.find((order) => order.status === "paid");

    if (recentOrder) {
      const action =
        recentOrder.status === "received"
          ? "has been dispatched"
          : recentOrder.status === "delivered" ||
              recentOrder.status === "installed"
            ? "is awaiting your confirmation"
            : "is being processed";

      priorityItems.push({
        id: `order-${recentOrder._id}`,
        kind: "order",
        message: `Order #${getOrderReference(recentOrder)} ${action}`,
        relativeTime: formatRelativeTime(recentOrder.updatedAt, now),
        timestamp: recentOrder.updatedAt,
        href: "/dashboard/buyer/orders",
      });
    }

    const paidOrder = sortedOrders.find((order) =>
      /paid/i.test(order.paymentStatus || ""),
    );

    if (paidOrder) {
      priorityItems.push({
        id: `payment-${paidOrder._id}`,
        kind: "payment",
        message: `Payment of ${formatPlainMoney(paidOrder.totalPrice)} was confirmed for your order`,
        relativeTime: formatRelativeTime(paidOrder.updatedAt, now),
        timestamp: paidOrder.updatedAt,
        href: "/dashboard/buyer/payments",
      });
    }
  }

  if (conversations?.length) {
    const latestConversation = [...conversations].sort((a, b) => {
      const left = parseDate(a.lastMessageAt || a.createdAt)?.getTime() ?? 0;
      const right = parseDate(b.lastMessageAt || b.createdAt)?.getTime() ?? 0;
      return right - left;
    })[0];

    if (latestConversation) {
      const timestamp = latestConversation.lastMessageAt || latestConversation.createdAt;
      secondaryItems.push({
        id: `message-${latestConversation.id}`,
        kind: "message",
        message: `New message from ${latestConversation.counterpart.displayName}`,
        relativeTime: formatRelativeTime(timestamp, now),
        timestamp,
        href: "/dashboard/buyer/messaging",
      });
    }
  }

  if (serviceRequests?.length) {
    const latestServiceRequest = [...serviceRequests].sort((a, b) => {
      const left = parseDate(a.updatedAt)?.getTime() ?? 0;
      const right = parseDate(b.updatedAt)?.getTime() ?? 0;
      return right - left;
    })[0];

    if (latestServiceRequest) {
      const statusLabel =
        latestServiceRequest.status === ServiceRequestStatus.COMPLETED
          ? "was completed"
          : latestServiceRequest.status === ServiceRequestStatus.IN_PROGRESS
            ? "is in progress"
            : latestServiceRequest.status ===
                ServiceRequestStatus.WORK_COMPLETED
              ? "is awaiting your confirmation"
              : "was updated";

      secondaryItems.push({
        id: `service-request-${latestServiceRequest._id}`,
        kind: "service_request",
        message: `Engineer request for ${latestServiceRequest.equipmentName} ${statusLabel}`,
        relativeTime: formatRelativeTime(latestServiceRequest.updatedAt, now),
        timestamp: latestServiceRequest.updatedAt,
        href: "/dashboard/buyer/service-request",
      });
    }
  }

  const deduped = [...priorityItems, ...secondaryItems].reduce<BuyerDashboardActivity[]>(
    (collection, item) => {
    if (collection.some((existing) => existing.message === item.message)) {
      return collection;
    }
    collection.push(item);
    return collection;
    },
    [],
  );

  return deduped
    .sort((a, b) => {
      const left = parseDate(a.timestamp)?.getTime() ?? 0;
      const right = parseDate(b.timestamp)?.getTime() ?? 0;
      return right - left;
    })
    .slice(0, 4);
};

export function buildBuyerDashboardModel({
  orders,
  orderSummary = null,
  wallet = null,
  serviceRequests,
  serviceRequestStatusCounts,
  quotes,
  conversations,
  now = new Date(),
}: BuildBuyerDashboardModelInput): BuyerDashboardModel {
  const activeOrders = orders?.filter((order) =>
    ACTIVE_ORDER_STATUSES.includes(order.status),
  );
  const confirmationOrders = orders?.filter((order) =>
    CONFIRMATION_ORDER_STATUSES.includes(order.status),
  );
  const activeOrdersThisMonth = activeOrders?.filter((order) => {
    const createdAt = parseDate(order.createdAt);
    return createdAt ? isSameMonth(createdAt, now) : false;
  });
  const monthOrders = orders?.filter((order) => {
    const createdAt = parseDate(order.createdAt);
    return createdAt ? isSameMonth(createdAt, now) : false;
  });

  const spendThisMonth =
    orderSummary?.totalValue.thisMonth ??
    monthOrders?.reduce((sum, order) => sum + (order.totalPrice || 0), 0) ??
    null;
  const ordersThisMonth =
    orderSummary?.ordersThisMonth ?? monthOrders?.length ?? null;
  const averageOrderValue =
    orderSummary?.averageOrderValue ??
    (spendThisMonth == null || ordersThisMonth == null
      ? null
      : ordersThisMonth > 0
        ? Math.round(spendThisMonth / ordersThisMonth)
        : 0);
  const activeOrdersTotal =
    orderSummary?.activeOrders ?? activeOrders?.length ?? null;

  const openServiceRequests = serviceRequests?.filter(
    (request) =>
      request.status !== ServiceRequestStatus.COMPLETED &&
      request.status !== ServiceRequestStatus.REJECTED &&
      request.status !== ServiceRequestStatus.CLOSED_AFTER_DISPUTE,
  );

  const engineerRequests =
    openServiceRequests?.length ?? serviceRequestStatusCounts?.total ?? null;

  return {
    balance: wallet ? koboToNaira(wallet.availableBalance) : null,
    ordersNeedConfirmation:
      orderSummary?.awaitingBuyerConfirmation ??
      confirmationOrders?.length ??
      null,
    activeOrdersCard:
      orderSummary?.activeOrders ??
      (orders == null
        ? null
        : (activeOrdersThisMonth?.length ?? 0) > 0
          ? activeOrdersThisMonth?.length ?? 0
          : activeOrders?.length ?? 0),
    engineerRequests,
    activeOrdersTotal,
    spendThisMonth,
    ordersThisMonth,
    averageOrderValue,
    spendSeries: orders == null ? [] : buildSpendSeriesFromOrders(orders, now),
    activities: buildActivities(
      orders,
      quotes,
      conversations,
      serviceRequests,
      now,
    ),
  };
}
