import {
  getOrderDisplayId,
  getOrderProductImage,
  getPersonName,
} from "@/constants/demoBuyerOrders";
import { formatNaira } from "@/lib/wallet-format";
import type { Order } from "@/types/order";
import type {
  OrderDispute,
  OrderDisputeResolutionOutcome,
  OrderDisputeStatus,
} from "@/types/order-dispute";
import type { UserRef } from "@/types/rfq";

/** A flattened, display-ready view of an order dispute used by tables and cards. */
export interface BuyerDisputeRow {
  id: string;
  sourceId: string;
  orderId: string;
  orderSourceId?: string;
  amount: number;
  itemName: string;
  reason: string;
  against: string;
  status: string;
  resolutionOutcome?: OrderDisputeResolutionOutcome | null;
  createdAt: string;
}

export interface DisputeStatusTone {
  label: string;
  detailLabel: string;
  textClassName: string;
  badgeClassName: string;
  buttonClassName: string;
  isResolved: boolean;
  isPositive: boolean;
}

const asObject = <T,>(value: string | T | undefined | null): T | undefined =>
  value && typeof value === "object" ? (value as T) : undefined;

/** Builds a human-friendly dispute reference (`DSP-XXXXXX`) from a raw id. */
export const getDisputeDisplayId = (id: string | undefined) => {
  if (!id) return "Dispute ID";
  if (id.startsWith("DSP")) return id;
  return `DSP-${id.slice(-6).toUpperCase()}`;
};

/** Resolves the order linked to a dispute, when the API populated it. */
export const getDisputeOrder = (dispute: OrderDispute): Order | undefined =>
  asObject<Order>(dispute.order);

/** Resolves the dispute amount from the linked order's total price. */
export const getDisputeAmount = (dispute: OrderDispute): number =>
  getDisputeOrder(dispute)?.totalPrice ?? 0;

export const getDisputeProductName = (dispute: OrderDispute): string => {
  const order = getDisputeOrder(dispute);
  const item = order?.items?.[0];
  return order?.productName || item?.productName || "Product";
};

export const getDisputeProductImage = (
  dispute: OrderDispute,
): string | undefined => getOrderProductImage(getDisputeOrder(dispute));

export const getDisputeSellerName = (dispute: OrderDispute): string =>
  getPersonName(dispute.seller, "Distributor");

export const getDisputeSellerAvatar = (
  dispute: OrderDispute,
): string | undefined => asObject<UserRef>(dispute.seller)?.displayPhoto?.url;

export const getDisputeBuyerName = (dispute: OrderDispute): string =>
  getPersonName(dispute.buyer, "Buyer");

export const getDisputeBuyerAvatar = (
  dispute: OrderDispute,
): string | undefined => asObject<UserRef>(dispute.buyer)?.displayPhoto?.url;

export const formatDisputeAmount = (value: number): string => formatNaira(value);

const positiveOutcome = (
  outcome: OrderDisputeResolutionOutcome | null | undefined,
) => outcome === "refund_buyer";

/**
 * Resolves status colours and labels for both live dispute statuses
 * (`under_review | awaiting_evidence | resolved`) and the legacy demo
 * statuses (`ongoing | resolved | rejected`).
 */
export const getDisputeStatusTone = (
  status: OrderDisputeStatus | string | undefined,
  outcome?: OrderDisputeResolutionOutcome | null,
  viewerRole: DisputeViewerRole = "buyer",
): DisputeStatusTone => {
  if (status === "resolved") {
    // The buyer "wins" on a refund; the distributor "wins" on a release.
    const positive =
      viewerRole === "buyer"
        ? positiveOutcome(outcome)
        : outcome === "release_to_seller";
    const otherParty = viewerRole === "buyer" ? "seller" : "buyer";
    return {
      label: "Resolved",
      detailLabel: positive
        ? "Resolved in favour of you"
        : `Resolved in favour of ${otherParty}`,
      textClassName: positive ? "text-[#16A34A]" : "text-[#6B7280]",
      badgeClassName: positive
        ? "bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]"
        : "bg-[#F3F4F6] text-[#6B7280] border-[#DDE0E5]",
      buttonClassName: positive
        ? "bg-[#16A34A] text-white"
        : "bg-[#6B7280] text-white",
      isResolved: true,
      isPositive: positive,
    };
  }

  if (status === "rejected") {
    return {
      label: "Rejected",
      detailLabel: "Rejected",
      textClassName: "text-[#EF4444]",
      badgeClassName: "bg-[#FEE2E2] text-[#EF4444] border-[#FCA5A5]",
      buttonClassName: "bg-[#EF4444] text-white",
      isResolved: true,
      isPositive: false,
    };
  }

  if (status === "awaiting_evidence") {
    return {
      label: "Awaiting evidence",
      detailLabel: "More information needed",
      textClassName: "text-[#FE6E00]",
      badgeClassName: "bg-[#FFF6D9] text-[#FE6E00] border-[#FDBA74]",
      buttonClassName: "bg-[#FE6E00] text-white",
      isResolved: false,
      isPositive: false,
    };
  }

  // under_review / ongoing / unknown
  return {
    label: "Under review",
    detailLabel: "Waiting for seller to respond",
    textClassName: "text-[#FE6E00]",
    badgeClassName: "bg-[#FFE3DD] text-[#E33C13] border-[#FDBA74]",
    buttonClassName: "bg-[#FE6E00] text-white",
    isResolved: false,
    isPositive: false,
  };
};

/** The outcome line shown on resolved disputes, phrased for the given viewer. */
export const getDisputeOutcomeLabel = (
  outcome: OrderDisputeResolutionOutcome | null | undefined,
  viewerRole: DisputeViewerRole = "buyer",
): string => {
  switch (outcome) {
    case "refund_buyer":
      return viewerRole === "buyer"
        ? "Refund issued to your wallet"
        : "Refund issued to the buyer";
    case "release_to_seller":
      return viewerRole === "buyer"
        ? "Funds released to the seller"
        : "Funds released to you";
    case "closed_after_dispute":
      return "Dispute closed";
    default:
      return "Pending resolution";
  }
};

export type DisputeActivityRole = "buyer" | "seller" | "admin" | "neutral";

/** Whose perspective the timeline is rendered from. */
export type DisputeViewerRole = "buyer" | "seller";

export interface DisputeActivityEvent {
  id: string;
  title: string;
  roleLabel: string;
  roleTone: DisputeActivityRole;
  text?: string;
  attachment?: { fileName: string; url: string };
  timestamp: string;
  variant: "flag" | "add" | "check" | "pending" | "seller" | "admin";
}

const roleToneFor = (role: string | undefined): DisputeActivityRole => {
  const value = (role || "").toLowerCase();
  if (value.includes("buyer")) return "buyer";
  if (value.includes("seller") || value.includes("distributor")) return "seller";
  if (value.includes("admin") || value.includes("support")) return "admin";
  return "neutral";
};

const roleLabelFor = (tone: DisputeActivityRole): string => {
  switch (tone) {
    case "buyer":
      return "Buyer";
    case "seller":
      return "Distributor";
    case "admin":
      return "Admin";
    default:
      return "System";
  }
};

/**
 * Composes the dispute activity timeline from the synthetic "opened" event,
 * the buyer/seller/admin comments, any additional evidence uploads, and the
 * final resolution event. `viewerRole` determines whether actions read as
 * "You …" (the buyer or the distributor).
 */
export const buildDisputeActivity = (
  dispute: OrderDispute,
  options?: { currentUserId?: string; viewerRole?: DisputeViewerRole },
): DisputeActivityEvent[] => {
  const { currentUserId, viewerRole = "buyer" } = options ?? {};
  const firstEvidence = dispute.evidence?.[0];

  const openedEvent: DisputeActivityEvent = {
    id: `${dispute._id}-opened`,
    title:
      viewerRole === "buyer"
        ? "You opened this dispute"
        : "Buyer opened this dispute",
    roleLabel: "Buyer",
    roleTone: "buyer",
    text: dispute.description,
    attachment: firstEvidence
      ? { fileName: firstEvidence.fileName, url: firstEvidence.url }
      : undefined,
    timestamp: dispute.createdAt,
    variant: "flag",
  };

  const commentEvents: DisputeActivityEvent[] = (dispute.comments || []).map(
    (comment, index) => {
      const tone = roleToneFor(comment.authorRole);
      const isMine =
        !!currentUserId &&
        typeof comment.author === "object" &&
        comment.author._id === currentUserId;

      let title: string;
      let variant: DisputeActivityEvent["variant"];
      if (tone === "buyer") {
        title =
          isMine && viewerRole === "buyer" ? "You added a response" : "Buyer responded";
        variant = "add";
      } else if (tone === "seller") {
        title =
          isMine && viewerRole === "seller"
            ? "You responded"
            : "Distributor responded";
        variant = "seller";
      } else if (tone === "admin") {
        title = "Admin responded";
        variant = "admin";
      } else {
        title = "Update added";
        variant = "add";
      }

      return {
        id: `${dispute._id}-comment-${index}`,
        title,
        roleLabel: roleLabelFor(tone),
        roleTone: tone,
        text: comment.text,
        timestamp: comment.createdAt,
        variant,
      };
    },
  );

  // Show all evidence items beyond the first (which is already on the opened
  // event) as separate timeline entries so uploaded attachments appear in the feed.
  const evidenceEvents: DisputeActivityEvent[] = (dispute.evidence || [])
    .slice(1)
    .map((evidence, index) => {
      const uploadedByMe =
        !!currentUserId &&
        typeof evidence.uploadedBy === "object" &&
        (evidence.uploadedBy as UserRef)._id === currentUserId;
      const tone: DisputeActivityRole = uploadedByMe
        ? viewerRole
        : viewerRole === "buyer"
          ? "seller"
          : "buyer";
      const title = uploadedByMe
        ? "You uploaded evidence"
        : tone === "buyer"
          ? "Buyer uploaded evidence"
          : "Distributor uploaded evidence";

      return {
        id: `${dispute._id}-evidence-${index + 1}`,
        title,
        roleLabel: roleLabelFor(tone),
        roleTone: tone,
        attachment: { fileName: evidence.fileName, url: evidence.url },
        timestamp: evidence.createdAt,
        variant: (tone === "seller" ? "seller" : "add") as DisputeActivityEvent["variant"],
      };
    });

  // Merge comments and additional evidence in chronological order.
  const middleEvents = [...commentEvents, ...evidenceEvents].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  const events: DisputeActivityEvent[] = [openedEvent, ...middleEvents];

  if (dispute.status === "resolved") {
    events.push({
      id: `${dispute._id}-resolved`,
      title: "Admin resolved the dispute",
      roleLabel: "Admin",
      roleTone: "admin",
      text: dispute.resolutionNote || getDisputeOutcomeLabel(dispute.resolutionOutcome),
      timestamp: dispute.resolvedAt || dispute.updatedAt,
      variant: "check",
    });
  } else if (viewerRole === "buyer") {
    events.push({
      id: `${dispute._id}-pending`,
      title: "Waiting for seller to respond",
      roleLabel: "Buyer",
      roleTone: "buyer",
      timestamp: dispute.updatedAt,
      variant: "pending",
    });
  }

  return events;
};

const baseDisputeRow = (dispute: OrderDispute): Omit<BuyerDisputeRow, "against"> => {
  const order = getDisputeOrder(dispute);
  const orderSourceId =
    order?._id ?? (typeof dispute.order === "string" ? dispute.order : undefined);
  return {
    id: getDisputeDisplayId(dispute._id),
    sourceId: dispute._id,
    orderId: getOrderDisplayId(orderSourceId),
    orderSourceId,
    amount: getDisputeAmount(dispute),
    itemName: getDisputeProductName(dispute),
    reason: dispute.reason,
    status: dispute.status,
    resolutionOutcome: dispute.resolutionOutcome,
    createdAt: dispute.createdAt,
  };
};

/** Maps a live dispute into the row shape used by the buyer disputes table. */
export const toBuyerDisputeRow = (dispute: OrderDispute): BuyerDisputeRow => ({
  ...baseDisputeRow(dispute),
  against: getDisputeSellerName(dispute),
});

/**
 * Maps a live dispute into the row shape used by the distributor disputes table.
 * From the distributor's perspective the dispute was raised by the buyer.
 */
export const toDistributorDisputeRow = (dispute: OrderDispute): BuyerDisputeRow => ({
  ...baseDisputeRow(dispute),
  against: getDisputeBuyerName(dispute),
});
