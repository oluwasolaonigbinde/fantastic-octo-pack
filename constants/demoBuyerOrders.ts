import { ORDER_STATUS_LABELS, type Order, type OrderLineItem } from "@/types/order";
import type { ProductRef, UserRef } from "@/types/rfq";

export type BuyerOrderStage =
  | "ongoing"
  | "payment"
  | "delivery"
  | "installation"
  | "completed";

/** One product line within an order, normalized for display. */
export interface BuyerOrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  productImage?: string;
}

export interface BuyerOrderRow {
  id: string;
  sourceId: string;
  status: string;
  /**
   * First product's name (single-product back-compat). For multi-product orders
   * prefer `productSummary` for a one-line label and `items` for the breakdown.
   */
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
  supplierName: string;
  productImage?: string;
  /** Every product line on the order (always at least one). */
  items: BuyerOrderItem[];
  /** Number of distinct product lines. */
  itemCount: number;
  /** Total units across all lines. */
  totalQuantity: number;
  /** One-line label: the product name, or "First item +N more" when multiple. */
  productSummary: string;
}

export const buyerOrderMilestones = [
  "Create order",
  "Payment",
  "Delivery",
  "Installation",
  "Completed",
];

export const buyerMobileMilestones = [
  "Create order",
  "Payment",
  "Delivery",
  "Packaging",
  "Dispatched",
  "Delivery completed",
  "Installation",
  "Completed",
];

export const buyerDemoOrderMeta = {
  paymentMethod: "ESCROW",
  paymentType: "BAIY trade assurance",
  paymentStatus: "Paid",
  paymentReference: "BAIY-TRX-000792",
  transactionId: "TXN-BAIY-902394",
  invoiceId: "INV-902394",
  deliveryFee: 0,
  deliveryAddress: {
    name: "Samuel Smart",
    address: "38 Asheik Jarma Street, Jabi Abuja",
    email: "example55@gmail.com",
    phone: "090384736378",
  },
  supplier: {
    name: "Fika Store",
    role: "Supplier",
    phone: "090384736378",
    email: "fikastore@example.com",
  },
  escrow: {
    remaining: "2 days 11 hrs",
    expectedBy: "Thursday 26 - April at 11:59PM",
    currentStatus: "Awaiting buyer confirmation",
    productStatus: "Delivery Completed",
    releasedStatus: "Released",
    note:
      "Escrow auto releases in 2 days after confirmation, ensure you confirm before timer elapses.",
  },
  evidenceImages: [
    "https://images.unsplash.com/photo-1581093458791-9d15482442f6?auto=format&fit=crop&w=240&q=80",
    "https://images.unsplash.com/photo-1583912267550-d44c6b1d70d1?auto=format&fit=crop&w=240&q=80",
    "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=240&q=80",
    "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=240&q=80",
  ],
};

const demoOrderSeeds = [
  {
    id: "ORD-123456",
    sourceId: "ORD-123456",
    status: "created_pending_payment",
    productName: "MRI machine",
    quantity: 12,
    unitPrice: 60028,
    totalPrice: 780070,
    createdAt: "2025-09-24T09:30:00.000Z",
    supplierName: "Fika Store",
  },
  {
    id: "ORD-123457",
    sourceId: "ORD-123457",
    status: "cancelled_pre_payment",
    productName: "Ultrasound scanner",
    quantity: 12,
    unitPrice: 60028,
    totalPrice: 780070,
    createdAt: "2025-09-24T09:30:00.000Z",
    supplierName: "Fika Store",
  },
  {
    id: "ORD-123458",
    sourceId: "ORD-123458",
    status: "not_paid",
    productName: "Patient monitor",
    quantity: 12,
    unitPrice: 60028,
    totalPrice: 780070,
    createdAt: "2025-09-24T09:30:00.000Z",
    supplierName: "Fika Store",
  },
  {
    id: "ORD-123459",
    sourceId: "ORD-123459",
    status: "completed",
    productName: "Infusion pump",
    quantity: 12,
    unitPrice: 60028,
    totalPrice: 780070,
    createdAt: "2025-09-24T09:30:00.000Z",
    supplierName: "Fika Store",
  },
  {
    id: "ORD-123460",
    sourceId: "ORD-123460",
    status: "completed",
    productName: "Anesthesia machine",
    quantity: 12,
    unitPrice: 60028,
    totalPrice: 780070,
    createdAt: "2025-09-24T09:30:00.000Z",
    supplierName: "Fika Store",
  },
];

/** One-line label for an order's products: the name, or "First +N more". */
export const buildOrderItemSummary = (items: BuyerOrderItem[]): string => {
  if (items.length === 0) return "Name of the product";
  if (items.length === 1) return items[0].productName;
  return `${items[0].productName} +${items.length - 1} more`;
};

// The demo orders are single-product; derive the multi-item shape from their
// core fields so they satisfy BuyerOrderRow like live orders do.
export const buyerDemoOrders: BuyerOrderRow[] = demoOrderSeeds.map((seed) => {
  const items: BuyerOrderItem[] = [
    {
      productName: seed.productName,
      quantity: seed.quantity,
      unitPrice: seed.unitPrice,
    },
  ];
  return {
    ...seed,
    items,
    itemCount: items.length,
    totalQuantity: seed.quantity,
    productSummary: buildOrderItemSummary(items),
  };
});

const toTitleCase = (value: string) =>
  value
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1));

export const getReadableOrderStatus = (status: string | undefined) => {
  if (!status) return "Unknown";
  return ORDER_STATUS_LABELS[status] || toTitleCase(status);
};

export const getBuyerOrderStatusTone = (status: string | undefined) => {
  switch (status) {
    case "created_pending_payment":
      return {
        label: "Processing",
        badgeClassName: "bg-[#FF6B00] text-white",
        textClassName: "text-[#F59E0B]",
      };
    case "cancelled_pre_payment":
      return {
        label: "Cancelled",
        badgeClassName: "bg-[#FEE2E2] text-[#DC2626]",
        textClassName: "text-[#EF4444]",
      };
    case "not_paid":
      return {
        label: "Not Paid",
        badgeClassName: "bg-[#FEF2F2] text-[#EF4444]",
        textClassName: "text-[#EF4444]",
      };
    case "received":
      return {
        label: "Order received",
        badgeClassName: "bg-[#DBEAFE] text-[#0669D9]",
        textClassName: "text-[#0669D9]",
      };
    // The distributor has delivered (or installed), but it's the buyer who
    // confirms receipt — so it stays "Delivery in progress" until they do.
    case "delivered":
    case "installed":
    case "fulfilled":
      return {
        label: "Delivery in progress",
        badgeClassName: "bg-[#FFEDD5] text-[#EA580C]",
        textClassName: "text-[#EA580C]",
      };
    case "completed":
      return {
        label: "Completed",
        badgeClassName: "bg-[#DCFCE7] text-[#16A34A]",
        textClassName: "text-[#16A34A]",
      };
    default:
      return {
        label: getReadableOrderStatus(status),
        badgeClassName: "bg-[#F3F4F6] text-[#4B5563]",
        textClassName: "text-[#4B5563]",
      };
  }
};

export const getOrderDisplayId = (orderId: string | undefined) => {
  if (!orderId) return "Order ID";
  if (orderId.startsWith("ORD-")) return orderId;
  return `ORD-${orderId.slice(-6).toUpperCase()}`;
};

export const getPersonName = (
  person: string | UserRef | undefined,
  fallback: string,
) => {
  if (person && typeof person === "object") {
    const name = [person.firstName, person.lastName].filter(Boolean).join(" ").trim();
    return name || person.email || fallback;
  }
  return fallback;
};

export const getOrderProductImage = (order: Order | null | undefined) => {
  // Live API returns a flat `product`; legacy/demo data nests it under items[0].
  const product = order?.product ?? order?.items?.[0]?.product;
  if (product && typeof product === "object") {
    return (product as ProductRef).images?.[0]?.url;
  }
  return undefined;
};

const productRefImage = (product: OrderLineItem["product"] | undefined) =>
  product && typeof product === "object"
    ? (product as ProductRef).images?.[0]?.url
    : undefined;

export const toBuyerOrderRow = (order: Order): BuyerOrderRow => {
  // An order carries either a normalized items[] (RFQ / multi-product orders) or
  // flat top-level product fields (single-product buy-now). Build a uniform line
  // list from whichever is present so the UI never assumes a single product.
  const items: BuyerOrderItem[] =
    order.items && order.items.length > 0
      ? order.items.map((line) => ({
          productName: line.productName || "Name of the product",
          quantity: line.quantity ?? 1,
          unitPrice:
            line.pricePerUnit ??
            (line.quantity ? order.totalPrice / line.quantity : order.totalPrice),
          productImage: productRefImage(line.product),
        }))
      : [
          {
            productName: order.productName || "Name of the product",
            quantity: order.quantity ?? 1,
            unitPrice: order.quantity
              ? order.totalPrice / order.quantity
              : order.totalPrice,
            productImage: getOrderProductImage(order),
          },
        ];

  const totalQuantity = items.reduce((sum, line) => sum + line.quantity, 0);
  const first = items[0];

  return {
    id: getOrderDisplayId(order._id),
    sourceId: order._id,
    // Single-product back-compat fields mirror the first line.
    productName: first.productName,
    quantity: first.quantity,
    unitPrice: first.unitPrice,
    totalPrice: order.totalPrice,
    createdAt: order.createdAt,
    status: order.status,
    supplierName: getPersonName(order.seller, buyerDemoOrderMeta.supplier.name),
    productImage: first.productImage,
    items,
    itemCount: items.length,
    totalQuantity,
    productSummary: buildOrderItemSummary(items),
  };
};
