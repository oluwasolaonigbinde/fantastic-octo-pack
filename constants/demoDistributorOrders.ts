import { ORDER_STATUS_LABELS } from "@/types/order";

export type DistributorDemoDisputeStatus = "ongoing" | "resolved" | "rejected";

export interface DistributorDemoOrder {
  id: string;
  status: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
  buyerName: string;
}

export interface DistributorDemoDispute {
  id: string;
  orderId: string;
  status: DistributorDemoDisputeStatus | string;
  reason: string;
  createdAt: string;
  amount: number;
  itemName: string;
  against: string;
  description: string;
  resolutionTime: string;
  evidence: {
    label: string;
    fileName: string;
  };
  notes: Array<{
    id: string;
    text: string;
    attachment?: string;
    sentBy: string;
    time: string;
    accent: "blue" | "yellow" | "green";
  }>;
}

export const distributorDemoOrderMeta = {
  paymentStatus: "Not Paid",
  paymentMethod: "ESCROW",
  paymentType: "Bank transfer",
  invoiceName: "Invoice.pdf",
  paymentDetails: [
    { label: "Items total", value: "N75,000" },
    { label: "Delivery fee", value: "N1,000" },
  ],
  deliveryAddress:
    "38 Asheik Jarma Street, Jabi Abuja example55@gmail.com 090384736378",
  deliveryAddressLong:
    "Lorem ipsum dolor sit amet consectetur. Cras arcu sit massa consequat mi quis purus. Arcu enim sit sed aenean lorem tincidunt. Arcu mauris dictumst sed bibendum.",
  buyer: {
    name: "Samuel Smart",
    role: "Buyer",
    phone: "0098789977",
    email: "Bank transfer",
  },
  escrow: {
    remaining: "2 days 11 hrs",
    expectedBy: "Thursday 26 - April at 11:59PM",
    productStatus: "Delivery Completed",
    note:
      "Escrow auto releases in 2 days after confirmation, ensure you confirm before timer elapses.",
  },
};

export const distributorDemoOrders: DistributorDemoOrder[] = [
  {
    id: "ORD-123456",
    status: "created_pending_payment",
    productName: "MRI machine",
    quantity: 5,
    unitPrice: 20000,
    totalPrice: 150000,
    createdAt: "2025-09-25T09:30:00.000Z",
    buyerName: "Samuel Smart",
  },
  {
    id: "ORD-123457",
    status: "cancelled_pre_payment",
    productName: "Ultrasound scanner",
    quantity: 12,
    unitPrice: 60028,
    totalPrice: 780070,
    createdAt: "2025-09-24T09:30:00.000Z",
    buyerName: "Samuel Smart",
  },
  {
    id: "ORD-123458",
    status: "completed",
    productName: "Patient monitor",
    quantity: 12,
    unitPrice: 60028,
    totalPrice: 780070,
    createdAt: "2025-09-24T09:30:00.000Z",
    buyerName: "Samuel Smart",
  },
  {
    id: "ORD-123459",
    status: "completed",
    productName: "Infusion pump",
    quantity: 12,
    unitPrice: 60028,
    totalPrice: 780070,
    createdAt: "2025-09-24T09:30:00.000Z",
    buyerName: "Samuel Smart",
  },
];

export const distributorDemoDisputes: DistributorDemoDispute[] = [
  {
    id: "DSP-123456",
    orderId: "ORD-123456",
    status: "ongoing",
    reason: "Item not delivered.",
    createdAt: "2025-11-27T09:30:00.000Z",
    amount: 150000,
    itemName: "MRI machine",
    against: "Distributor (Samuel Smart)",
    description:
      "Figma ipsum component variant main layer. Group flatten auto rotate link slice layer. Effect draft style invite flows union. Polygon object variant scrolling image main slice scale.",
    resolutionTime: "24-48 hours",
    evidence: {
      label: "Attached document",
      fileName: "Attachment.pdf",
    },
    notes: [
      {
        id: "note-1",
        text: "Figma ipsum component variant main layer. Outline arrange main vector text. Figma follower auto resizing bold selection opacity.",
        attachment: "Attachment.pdf",
        sentBy: "Me",
        time: "9:30am",
        accent: "blue",
      },
      {
        id: "note-2",
        text: "Figma ipsum component variant main layer. Outline arrange main vector text. Figma follower auto resizing bold selection opacity.",
        sentBy: "Admin",
        time: "9:30am",
        accent: "yellow",
      },
      {
        id: "note-3",
        text: "Figma ipsum component variant main layer. Outline arrange main vector text. Figma follower auto resizing bold selection opacity.",
        sentBy: "Distributor",
        time: "9:30am",
        accent: "green",
      },
    ],
  },
  {
    id: "DSP-123457",
    orderId: "ORD-123457",
    status: "resolved",
    reason: "This will be the reason title",
    createdAt: "2025-11-24T09:30:00.000Z",
    amount: 150000,
    itemName: "MRI machine",
    against: "Distributor",
    description:
      "Evidence was reviewed and the support team has logged a visual-only resolution for this demo state.",
    resolutionTime: "24-48 hours",
    evidence: {
      label: "Attached document",
      fileName: "Resolved-evidence.pdf",
    },
    notes: [],
  },
  {
    id: "DSP-123458",
    orderId: "ORD-123458",
    status: "rejected",
    reason: "This will be the reason title",
    createdAt: "2025-11-22T09:30:00.000Z",
    amount: 150000,
    itemName: "MRI machine",
    against: "Distributor",
    description:
      "The dispute was rejected in this frontend-only sample data. No backend dispute state was changed.",
    resolutionTime: "24-48 hours",
    evidence: {
      label: "Attached document",
      fileName: "Rejected-evidence.pdf",
    },
    notes: [],
  },
];

export const distributorDemoMilestones = [
  "Create order",
  "Payment",
  "Delivery",
  "Installation",
  "Completed",
];

const toTitleCase = (value: string) =>
  value
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1));

export const getReadableStatusLabel = (
  status: string | undefined,
  labels: Record<string, string> = ORDER_STATUS_LABELS,
) => {
  if (!status) return "Unknown";
  return labels[status] || toTitleCase(status);
};

export const getOrderStatusTone = (status: string | undefined) => {
  switch (status) {
    case "created_pending_payment":
      return {
        label: "Processing",
        className: "bg-[#FF6B00] text-white",
        textClassName: "text-[#F59E0B]",
      };
    case "cancelled_pre_payment":
      return {
        label: "Cancelled",
        className: "bg-[#FEE2E2] text-[#DC2626]",
        textClassName: "text-[#DC2626]",
      };
    case "received":
      return {
        label: "Order received",
        className: "bg-[#DBEAFE] text-[#0669D9]",
        textClassName: "text-[#0669D9]",
      };
    // The distributor has delivered (or installed), but it's the buyer who
    // confirms receipt — so it stays "Delivery in progress" until they do.
    case "delivered":
    case "installed":
    case "fulfilled":
      return {
        label: "Delivery in progress",
        className: "bg-[#FFEDD5] text-[#EA580C]",
        textClassName: "text-[#EA580C]",
      };
    case "completed":
      return {
        label: "Completed",
        className: "bg-[#DCFCE7] text-[#16A34A]",
        textClassName: "text-[#16A34A]",
      };
    default:
      return {
        label: getReadableStatusLabel(status),
        className: "bg-[#F3F4F6] text-[#4B5563]",
        textClassName: "text-[#4B5563]",
      };
  }
};

export const getDisputeStatusTone = (status: string | undefined) => {
  switch (status) {
    case "ongoing":
      return { label: "Ongoing", className: "text-[#FF6B00]" };
    case "resolved":
      return { label: "Resolved", className: "text-[#16A34A]" };
    case "rejected":
      return { label: "Rejected", className: "text-[#EF4444]" };
    default:
      return {
        label: getReadableStatusLabel(status, {}),
        className: "text-[#4B5563]",
      };
  }
};
