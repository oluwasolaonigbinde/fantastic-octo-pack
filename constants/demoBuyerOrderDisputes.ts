import { buyerDemoOrders } from "@/constants/demoBuyerOrders";

export type BuyerOrderDisputeStatus = "ongoing" | "resolved" | "rejected";

export interface BuyerOrderDisputeNote {
  id: string;
  text: string;
  sentBy: "Me" | "Admin" | "Distributor";
  time: string;
  attachment?: string;
}

export interface BuyerOrderDispute {
  id: string;
  orderId: string;
  status: BuyerOrderDisputeStatus;
  amount: number;
  itemName: string;
  reason: string;
  against: string;
  description: string;
  paymentType: string;
  createdAt: string;
  resolutionTime: string;
  evidence: {
    label: string;
    fileName: string;
  };
  notes: BuyerOrderDisputeNote[];
  adminResolution?: {
    title: string;
    refundAmount: number;
    refundDeadline: string;
    note: string;
  };
}

const noteText =
  "Figma ipsum component variant main layer. Outline arrange main vector text. Figma follower auto resizing bold selection opacity.";

export const buyerDemoOrderDisputes: BuyerOrderDispute[] = [
  {
    id: "DSP-123456",
    orderId: buyerDemoOrders[0]?.id || "ORD-123456",
    status: "ongoing",
    amount: 150000,
    itemName: "MRI machine",
    reason: "This will be the reason title",
    against: "Distributor",
    description:
      "Figma ipsum component variant main layer. Group flatten auto rotate link slice layer. Effect draft style invite flows union. Polygon object variant scrolling image main slice scale. Selection variant plugin frame undo style stroke create create. Italic union pen figjam component edit create flatten boolean flatten.",
    paymentType: "ESCROW",
    createdAt: "2025-11-27T09:30:00.000Z",
    resolutionTime: "24-48 hours",
    evidence: {
      label: "Attached document",
      fileName: "Attachment.pdf",
    },
    notes: [
      { id: "note-1", text: noteText, attachment: "Attachment.pdf", sentBy: "Me", time: "9:30am" },
      { id: "note-2", text: noteText, sentBy: "Admin", time: "9:30am" },
      { id: "note-3", text: noteText, sentBy: "Distributor", time: "9:30am" },
    ],
  },
  {
    id: "DSP-123457",
    orderId: buyerDemoOrders[1]?.id || "ORD-123457",
    status: "resolved",
    amount: 150000,
    itemName: "MRI machine",
    reason: "This will be the reason title",
    against: "Distributor",
    description:
      "Figma ipsum component variant main layer. Group flatten auto rotate link slice layer. Effect draft style invite flows union. Polygon object variant scrolling image main slice scale.",
    paymentType: "ESCROW",
    createdAt: "2025-11-25T09:30:00.000Z",
    resolutionTime: "24-48 hours",
    evidence: {
      label: "Attached document",
      fileName: "Attachment.pdf",
    },
    notes: [
      { id: "note-1", text: noteText, attachment: "Attachment.pdf", sentBy: "Me", time: "9:30am" },
      { id: "note-2", text: noteText, sentBy: "Admin", time: "9:30am" },
      { id: "note-3", text: noteText, sentBy: "Distributor", time: "9:30am" },
    ],
    adminResolution: {
      title: "Admin resolution summary",
      refundAmount: 50000,
      refundDeadline: "29/11/2025",
      note: "Refund has been approved for this visual preview.",
    },
  },
  {
    id: "DSP-123458",
    orderId: buyerDemoOrders[2]?.id || "ORD-123458",
    status: "rejected",
    amount: 150000,
    itemName: "MRI machine",
    reason: "This will be the reason title",
    against: "Distributor",
    description:
      "Figma ipsum component variant main layer. Group flatten auto rotate link slice layer. Effect draft style invite flows union.",
    paymentType: "ESCROW",
    createdAt: "2025-11-22T09:30:00.000Z",
    resolutionTime: "24-48 hours",
    evidence: {
      label: "Attached document",
      fileName: "Attachment.pdf",
    },
    notes: [
      { id: "note-1", text: noteText, attachment: "Attachment.pdf", sentBy: "Me", time: "9:30am" },
      { id: "note-2", text: noteText, sentBy: "Admin", time: "9:30am" },
      { id: "note-3", text: noteText, sentBy: "Distributor", time: "9:30am" },
    ],
  },
  {
    id: "DSP-123459",
    orderId: buyerDemoOrders[3]?.id || "ORD-123459",
    status: "ongoing",
    amount: 150000,
    itemName: "MRI machine",
    reason: "This will be the reason title",
    against: "Distributor",
    description:
      "Figma ipsum component variant main layer. Group flatten auto rotate link slice layer. Effect draft style invite flows union.",
    paymentType: "ESCROW",
    createdAt: "2025-11-21T09:30:00.000Z",
    resolutionTime: "24-48 hours",
    evidence: {
      label: "Attached document",
      fileName: "Attachment.pdf",
    },
    notes: [
      { id: "note-1", text: noteText, attachment: "Attachment.pdf", sentBy: "Me", time: "9:30am" },
      { id: "note-2", text: noteText, sentBy: "Admin", time: "9:30am" },
      { id: "note-3", text: noteText, sentBy: "Distributor", time: "9:30am" },
    ],
  },
];

export const buyerOrderDisputeMetrics = {
  flagged: String(14).padStart(2, "0"),
  resolved: String(10).padStart(2, "0"),
  ongoing: String(2).padStart(2, "0"),
  rejected: String(2).padStart(2, "0"),
};

export const getBuyerOrderDisputeStatusTone = (
  status: BuyerOrderDisputeStatus | string | undefined,
) => {
  switch (status) {
    case "resolved":
      return {
        label: "Resolved",
        detailLabel: "Approved",
        textClassName: "text-[#16A34A]",
        badgeClassName: "bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]",
        buttonClassName: "bg-[#16A34A] text-white",
      };
    case "rejected":
      return {
        label: "Rejected",
        detailLabel: "Rejected",
        textClassName: "text-[#EF4444]",
        badgeClassName: "bg-[#FEE2E2] text-[#EF4444] border-[#FCA5A5]",
        buttonClassName: "bg-[#EF4444] text-white",
      };
    case "ongoing":
    default:
      return {
        label: "Ongoing",
        detailLabel: "More information needed",
        textClassName: "text-[#FE6E00]",
        badgeClassName: "bg-[#FFF1E8] text-[#FE6E00] border-[#FDBA74]",
        buttonClassName: "bg-[#FE6E00] text-white",
      };
  }
};

export const findBuyerOrderDispute = (disputeId: string) =>
  buyerDemoOrderDisputes.find((dispute) => dispute.id === disputeId) ||
  buyerDemoOrderDisputes[0];
