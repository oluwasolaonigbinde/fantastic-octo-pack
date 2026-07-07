import type { UserRef } from "./rfq";
import type { Order } from "./order";

export type OrderDisputeStatus =
  | "under_review"
  | "awaiting_evidence"
  | "resolved";

export type OrderDisputeResolutionOutcome =
  | "release_to_seller"
  | "refund_buyer"
  | "closed_after_dispute"
  | "split_funds";

export type OrderDisputeInventoryAction = "consume" | "release" | "none";

export interface OrderDisputeEvidence {
  url: string;
  fileName: string;
  mimeType?: string;
  uploadedBy?: string | UserRef;
  createdAt: string;
}

export interface OrderDisputeComment {
  author: string | UserRef;
  authorRole: string;
  text: string;
  createdAt: string;
}

export interface OrderDispute {
  _id: string;
  order: string | Order;
  buyer: string | UserRef;
  seller: string | UserRef;
  reason: string;
  description: string;
  status: OrderDisputeStatus;
  resolutionOutcome?: OrderDisputeResolutionOutcome | null;
  resolutionNote?: string | null;
  sellerAmount?: number | null;
  buyerAmount?: number | null;
  inventoryAction?: OrderDisputeInventoryAction | null;
  evidence: OrderDisputeEvidence[];
  comments: OrderDisputeComment[];
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderDisputeResponse {
  success: boolean;
  message: string;
  data: OrderDispute;
}

export interface OrderDisputeListPagination {
  docs: OrderDispute[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: number | null;
  previousPage: number | null;
}

export interface OrderDisputeListResponse {
  success: boolean;
  message: string;
  data: OrderDispute[] | OrderDisputeListPagination;
}

export interface CreateOrderDisputePayload {
  reason: string;
  description: string;
}

export interface ResolveOrderDisputePayload {
  resolutionOutcome: OrderDisputeResolutionOutcome;
  resolutionNote?: string;
  /** Required when resolutionOutcome is "split_funds". Must sum with buyerAmount to the order total. */
  sellerAmount?: number;
  /** Required when resolutionOutcome is "split_funds". Must sum with sellerAmount to the order total. */
  buyerAmount?: number;
  /** Required when resolutionOutcome is "split_funds". */
  inventoryAction?: OrderDisputeInventoryAction;
}
