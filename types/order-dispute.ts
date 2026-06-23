import type { UserRef } from "./rfq";
import type { Order } from "./order";

export type OrderDisputeStatus =
  | "under_review"
  | "awaiting_evidence"
  | "resolved";

export type OrderDisputeResolutionOutcome =
  | "release_to_seller"
  | "refund_buyer"
  | "closed_after_dispute";

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
}
