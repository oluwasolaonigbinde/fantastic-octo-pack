import { ORDER_STATUS_LABELS } from "@/types/order";

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
    case "payment_initiated":
      return {
        label: "Awaiting payment",
        className: "bg-[#F3F4F6] text-[#6B7280]",
        textClassName: "text-[#6B7280]",
      };
    // Buyer has paid and escrow is funded — this is the order the distributor
    // now needs to act on (mark received → delivered → installed).
    case "paid":
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
