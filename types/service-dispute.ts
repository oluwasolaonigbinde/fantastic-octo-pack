import type {
  ServiceRequestAttachment,
  ServiceRequestData,
  ServiceRequestParty,
} from "@/types/service-request";

export enum ServiceDisputeStatus {
  UNDER_REVIEW = "under_review",
  AWAITING_EVIDENCE = "awaiting_evidence",
  RESOLVED = "resolved",
}

export enum ServiceDisputeResolutionOutcome {
  CONTINUE_SERVICE = "continue_service",
  MARK_COMPLETED = "mark_completed",
  CLOSED_AFTER_DISPUTE = "closed_after_dispute",
}

export interface ServiceDisputeComment {
  author: string | ServiceRequestParty;
  authorRole: string;
  text: string;
  createdAt: string;
}

export interface ServiceDisputeEvidence extends ServiceRequestAttachment {
  fileName: string;
  mimeType?: string;
  uploadedBy?: string | ServiceRequestParty;
  createdAt: string;
}

export interface ServiceDisputeData {
  _id: string;
  serviceRequest: string | ServiceRequestData;
  buyer: string | ServiceRequestParty;
  engineer: string | ServiceRequestParty;
  reason: string;
  description: string;
  status: ServiceDisputeStatus;
  resolutionOutcome?: ServiceDisputeResolutionOutcome;
  resolutionNote?: string;
  evidence: ServiceDisputeEvidence[];
  comments: ServiceDisputeComment[];
  resolvedAt?: string;
  resolverId?: string | ServiceRequestParty;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceDisputeMutationResponse {
  success: boolean;
  message: string;
  data: {
    dispute: ServiceDisputeData;
    serviceRequest: ServiceRequestData;
  };
}

export interface ServiceDisputeResponse {
  success: boolean;
  message: string;
  data: ServiceDisputeData;
}

export interface ServiceDisputeListResponse {
  success: boolean;
  message: string;
  data:
    | ServiceDisputeData[]
    | {
        docs: ServiceDisputeData[];
        totalDocs: number;
        limit: number;
        totalPages: number;
        page: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        nextPage: number | null;
        previousPage: number | null;
      };
}
