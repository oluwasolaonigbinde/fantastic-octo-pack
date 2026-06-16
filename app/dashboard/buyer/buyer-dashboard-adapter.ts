"use client";

import type { Conversation } from "@/types/messaging";
import type { Order, OrderStatus } from "@/types/order";
import type { Quote, Rfq, UserRef } from "@/types/rfq";
import {
  ServiceRequestStatus,
  type ServiceRequestData,
  type ServiceRequestStatusCounts,
} from "@/types/service-request";

const FALLBACK_BALANCE = 12_500_000;
const FALLBACK_CONFIRMATIONS = 2;
const FALLBACK_ACTIVE_ORDERS_CARD = 8;
const FALLBACK_ACTIVE_ORDERS_TOTAL = 14;
const FALLBACK_ENGINEER_REQUESTS = 2;
const FALLBACK_SPEND_THIS_MONTH = 7_850_000;
const FALLBACK_ORDERS_THIS_MONTH = 23;
const FALLBACK_AVG_ORDER_VALUE = 341_304;

const ACTIVE_ORDER_STATUSES: OrderStatus[] = ["processing", "shipped", "delivered"];
const CONFIRMATION_ORDER_STATUSES: OrderStatus[] = ["delivered"];

const FALLBACK_SPEND_SERIES = [
  0.06,
  0.16,
  0.22,
  0.28,
  0.4,
  0.48,
  0.62,
  0.48,
  0.4,
  0.34,
  0.28,
  0.22,
  0.2,
  0.18,
  0.06,
].map((value, index) => ({
  label: `P${index + 1}`,
  value,
}));

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

export interface BuyerDashboardModel {
  balance: number;
  ordersNeedConfirmation: number;
  activeOrdersCard: number;
  engineerRequests: number;
  activeOrdersTotal: number;
  escrowBalance: number;
  spendThisMonth: number;
  ordersThisMonth: number;
  averageOrderValue: number;
  spendSeries: Array<{ label: string; value: number }>;
  activities: BuyerDashboardActivity[];
}

interface BuildBuyerDashboardModelInput {
  orders: Order[] | null;
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
  return (
    distributor.distributorStoreProfile?.businessName?.trim() ||
    distributor.businessName?.trim() ||
    [distributor.firstName, distributor.lastName].filter(Boolean).join(" ").trim() ||
    distributor.email ||
    "Distributor"
  );
};

const getOrderDisplayId = (orderId: string | undefined) => {
  if (!orderId) return "Order";
  if (orderId.startsWith("ORD-")) return orderId;
  return `ORD-${orderId.slice(-6).toUpperCase()}`;
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

const buildFallbackActivities = (now: Date): BuyerDashboardActivity[] => [
  {
    id: "fallback-quote-response",
    kind: "quote",
    message: "Distributor MedSupply responded to your RFQ for centrifuge machine",
    relativeTime: "10min ago",
    timestamp: new Date(now.getTime() - 10 * 60_000).toISOString(),
    href: "/dashboard/buyer/rfqs",
  },
  {
    id: "fallback-order-update",
    kind: "order",
    message: "Order #ORD-1234 has been shipped",
    relativeTime: "2 hours ago",
    timestamp: new Date(now.getTime() - 2 * 60 * 60_000).toISOString(),
    href: "/dashboard/buyer/orders",
  },
  {
    id: "fallback-payment",
    kind: "payment",
    message: "Payment of ₦1,250,000 was confirmed for your order",
    relativeTime: "Yesterday 4:30 PM",
    timestamp: new Date(now.getTime() - 19.5 * 60 * 60_000).toISOString(),
    href: "/dashboard/buyer/payments",
  },
  {
    id: "fallback-new-quote",
    kind: "quote",
    message: "New quote received for RFQ #RFQ-5678",
    relativeTime: "Yesterday 11:20 AM",
    timestamp: new Date(now.getTime() - 26.5 * 60 * 60_000).toISOString(),
    href: "/dashboard/buyer/rfqs",
  },
];

const buildScaledFallbackSpendSeries = (total: number) => {
  const safeTotal = total > 0 ? total : FALLBACK_SPEND_THIS_MONTH;

  return FALLBACK_SPEND_SERIES.map((point) => ({
    label: point.label,
    value: Math.round(point.value * safeTotal),
  }));
};

const buildSpendSeriesFromOrders = (orders: Order[], now: Date) => {
  const monthOrders = orders.filter((order) => {
    const createdAt = parseDate(order.createdAt);
    return createdAt ? isSameMonth(createdAt, now) : false;
  });

  const monthlyTotal = monthOrders.reduce(
    (sum, order) => sum + (order.totalPrice || 0),
    0,
  );

  if (monthOrders.length < 4) {
    return buildScaledFallbackSpendSeries(monthlyTotal);
  }

  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const bucketCount = FALLBACK_SPEND_SERIES.length;
  const buckets = Array.from({ length: bucketCount }, (_, index) => ({
    label: `P${index + 1}`,
    value: 0,
  }));

  monthOrders.forEach((order) => {
    const createdAt = parseDate(order.createdAt);
    if (!createdAt) return;
    const progress = (createdAt.getDate() - 1) / Math.max(daysInMonth - 1, 1);
    const bucketIndex = Math.min(
      bucketCount - 1,
      Math.max(0, Math.floor(progress * bucketCount)),
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

    const recentOrder =
      sortedOrders.find((order) => order.status === "shipped") ||
      sortedOrders.find((order) => order.status === "delivered") ||
      sortedOrders.find((order) => order.status === "processing");

    if (recentOrder) {
      const action =
        recentOrder.status === "shipped"
          ? "has been shipped"
          : recentOrder.status === "delivered"
            ? "is awaiting your confirmation"
            : "is being processed";

      priorityItems.push({
        id: `order-${recentOrder._id}`,
        kind: "order",
        message: `Order #${getOrderDisplayId(recentOrder._id)} ${action}`,
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

  const fallbackItems = buildFallbackActivities(now);
  const merged = [...deduped];

  fallbackItems.forEach((item) => {
    if (merged.length >= 4) return;
    if (merged.some((existing) => existing.kind === item.kind && existing.message === item.message)) {
      return;
    }
    merged.push(item);
  });

  return merged
    .sort((a, b) => {
      const left = parseDate(a.timestamp)?.getTime() ?? 0;
      const right = parseDate(b.timestamp)?.getTime() ?? 0;
      return right - left;
    })
    .slice(0, 4);
};

export function buildBuyerDashboardModel({
  orders,
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
    monthOrders?.reduce((sum, order) => sum + (order.totalPrice || 0), 0) ??
    FALLBACK_SPEND_THIS_MONTH;
  const ordersThisMonth = monthOrders?.length ?? FALLBACK_ORDERS_THIS_MONTH;
  const averageOrderValue =
    monthOrders == null
      ? FALLBACK_AVG_ORDER_VALUE
      : ordersThisMonth > 0
        ? Math.round(spendThisMonth / ordersThisMonth)
        : 0;
  const activeOrdersTotal = activeOrders?.length ?? FALLBACK_ACTIVE_ORDERS_TOTAL;

  const openServiceRequests = serviceRequests?.filter(
    (request) =>
      request.status !== ServiceRequestStatus.COMPLETED &&
      request.status !== ServiceRequestStatus.REJECTED &&
      request.status !== ServiceRequestStatus.CLOSED_AFTER_DISPUTE,
  );

  const engineerRequests =
    openServiceRequests != null
      ? openServiceRequests.length
      : serviceRequestStatusCounts?.total ??
        (serviceRequests ? serviceRequests.length : FALLBACK_ENGINEER_REQUESTS);

  return {
    balance: FALLBACK_BALANCE,
    ordersNeedConfirmation:
      confirmationOrders?.length ?? FALLBACK_CONFIRMATIONS,
    activeOrdersCard:
      orders == null
        ? FALLBACK_ACTIVE_ORDERS_CARD
        : (activeOrdersThisMonth?.length ?? 0) > 0
          ? activeOrdersThisMonth?.length ?? 0
          : activeOrders?.length ?? 0,
    engineerRequests,
    activeOrdersTotal,
    escrowBalance: FALLBACK_BALANCE,
    spendThisMonth,
    ordersThisMonth,
    averageOrderValue,
    spendSeries:
      orders == null
        ? buildScaledFallbackSpendSeries(FALLBACK_SPEND_THIS_MONTH)
        : buildSpendSeriesFromOrders(orders, now),
    activities: buildActivities(
      orders,
      quotes,
      conversations,
      serviceRequests,
      now,
    ),
  };
}
