import { ORDER_STATUS_LABELS, type Order } from "@/types/order";
import type { ProductRef, UserRef } from "@/types/rfq";

export type BuyerOrderStage =
  | "ongoing"
  | "payment"
  | "delivery"
  | "installation"
  | "completed";

export interface BuyerOrderRow {
  id: string;
  sourceId: string;
  status: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
  supplierName: string;
  productImage?: string;
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

export const buyerDemoOrders: BuyerOrderRow[] = [
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

export const toBuyerOrderRow = (order: Order): BuyerOrderRow => {
  // Prefer the flat live-API fields, falling back to legacy items[0].
  const item = order.items?.[0];
  const quantity = order.quantity ?? item?.quantity ?? 1;
  const productName =
    order.productName || item?.productName || "Name of the product";
  const productImage = getOrderProductImage(order);
  return {
    id: getOrderDisplayId(order._id),
    sourceId: order._id,
    productName,
    quantity,
    unitPrice: quantity ? order.totalPrice / quantity : order.totalPrice,
    totalPrice: order.totalPrice,
    createdAt: order.createdAt,
    status: order.status,
    supplierName: getPersonName(order.seller, buyerDemoOrderMeta.supplier.name),
    productImage,
  };
};
