export enum ServiceRequestStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  IN_PROGRESS = "in_progress",
  /** Engineer finished the work; awaiting buyer confirmation. */
  WORK_COMPLETED = "work_completed",
  COMPLETED = "completed",
  CLOSED_AFTER_DISPUTE = "closed_after_dispute",
}

export interface ServiceRequestAttachment {
  url: string;
  cloudinary_id: string;
}

export interface ServiceRequestProofOfCompletion extends ServiceRequestAttachment {
  fileName: string;
}

export interface ServiceRequestParty {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  businessName?: string;
  distributorStoreProfile?: {
    businessName?: string;
  };
  organization?: string;
}

export interface ServiceRequestData {
  _id: string;
  jobType: string;
  equipmentName: string;
  brand?: string;
  model?: string;
  serviceLocation?: string;
  preferredDate: string;
  preferredTime?: string;
  serviceDescription: string;
  photos?: ServiceRequestAttachment[];
  requester: string | ServiceRequestParty;
  engineer: string | ServiceRequestParty;
  status: ServiceRequestStatus;
  price?: number;
  unitPrice?: number;
  disputeActive: boolean;
  activeDisputeId?: string;
  activeDisputeStatus?: string;
  proofOfCompletion?: ServiceRequestProofOfCompletion;
  overdue?: boolean;
  createdAt: string;
  updatedAt: string;
}

/** POST /service-requests body — matches backend CreateServiceRequestDto; requester comes from JWT. */
export interface CreateServiceRequestPayload {
  jobType: string;
  equipmentName: string;
  brand?: string;
  model?: string;
  serviceLocation?: string;
  preferredDate: string;
  preferredTime?: string;
  serviceDescription: string;
  photos?: ServiceRequestAttachment[];
  engineerId: string;
}

export interface UpdateServiceRequestStatusPayload {
  status: ServiceRequestStatus;
  price?: number;
  unitPrice?: number;
}

/**
 * `GET /service-requests/summary` (role-scoped) and
 * `GET /admin/service-requests/summary` (platform-wide).
 */
export interface ServiceRequestSummary {
  total: number;
  /** Pending, accepted, in progress or work-completed — anything still in flight. */
  active: number;
  disputeActive: number;
  byStatus: Record<ServiceRequestStatus, number>;
}

export interface ServiceRequestSummaryResponse {
  success: boolean;
  message: string;
  data: ServiceRequestSummary;
}

export interface ServiceRequestStatusCounts {
  total: number;
  pending: number;
  completed: number;
  rejected: number;
}

export interface ServiceRequestListResponse {
  success: boolean;
  message: string;
  data: {
    docs: ServiceRequestData[];
    totalDocs: number;
    limit: number;
    totalPages: number;
    page: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage: number | null;
    previousPage: number | null;
    statusCounts?: ServiceRequestStatusCounts;
  };
}

export interface ServiceRequestResponse {
  success: boolean;
  message: string;
  data: ServiceRequestData;
}
