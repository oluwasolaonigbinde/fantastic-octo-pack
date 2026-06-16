import { UserRole } from "./user";

export interface KycTextFieldDefinition {
  fieldName: string;
  label: string;
  inputType: "text" | "dropdown";
  options?: string[];
}

export interface KycDocumentDefinition {
  fieldName: string;
  label: string;
}

export interface KycTierDefinition {
  tierKey: string;
  routeSlug: string;
  tierLabel: string;
  tierOrdinal: number;
  processingTime: string | null;
  isAutoGranted: boolean;
  submissionBehavior: "none" | "auto_approve" | "review_required";
  requiredTextFields: KycTextFieldDefinition[];
  requiredDocuments: KycDocumentDefinition[];
  detailTitle: string;
  detailSubtitle: string;
  badgeLabel: string;
}

export interface KycSubmissionDocument {
  fieldName: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  cloudinaryId: string;
  uploadedAt: string;
}

export interface KycSubmission {
  _id: string;
  userId: string;
  userRole: UserRole.BUYER | UserRole.DISTRIBUTOR | UserRole.OEM | UserRole.ENGINEER;
  tierKey: string;
  tierLabel: string;
  routeSlug?: string;
  status: "draft_submission" | "submitted" | "approved" | "rejected";
  textFields: Record<string, string>;
  documents: KycSubmissionDocument[];
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  submittedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface KycUploadResponseData {
  fileUrl: string;
  cloudinaryId: string;
  fileName: string;
  fileType: string;
}

export interface KycApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface AdminKycListRow {
  _id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  kycLevel: string;
  documentSubmitted: string;
  role: string;
  status: "Pending" | "Approved" | "Rejected" | string;
  registrationDate: string | null;
  createdAt: string | null;
}

export interface AdminKycStats {
  totalVerifiedUsers: number;
  pendingKycReviews: number;
  rejectedSubmissions: number;
  verificationFlagged: number;
}

export interface AdminKycSubmissionDetail extends KycSubmission {
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    displayPhoto?: {
      url: string;
      cloudinary_id: string;
    } | null;
  } | null;
  reviewer: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  } | null;
  requestStatusLabel: string;
}
