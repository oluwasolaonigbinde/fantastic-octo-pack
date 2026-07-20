import { UserRole } from "./user";

/**
 * Mirrors `baiy-server/src/features/kyc/*` as of commit `0558e4a feat: add kyc`.
 * The server is the source of truth — `GET /kyc/tiers` returns the live tier
 * catalogue. `constants/kycTiers.ts` holds a static mirror for routing/slugs.
 */

/**
 * The server only ever emits `"text"`. `"dropdown"` is a **frontend-only**
 * presentation override — every required text field is sent to the API as a
 * plain string regardless of which control renders it, so a role's UI is free
 * to swap in a select (country, state, ID type) without a server change.
 */
export type KycFieldInputType = "text" | "dropdown";

export interface KycTextFieldDefinition {
  fieldName: string;
  label: string;
  inputType: KycFieldInputType;
  /** Frontend-only; populated when a field is rendered as a dropdown. */
  options?: string[];
}

export interface KycDocumentDefinition {
  fieldName: string;
  label: string;
  /** Server defaults to 1 when the tier requires the document at all. */
  minimumCount?: number;
}

/**
 * - `none`         — auto-granted on signup, nothing to submit.
 * - `review_required` — user submits evidence, admin approves/rejects.
 * - `admin_only`   — recognition granted by Baiy admins; user cannot submit.
 */
export type KycSubmissionBehavior = "none" | "review_required" | "admin_only";

export interface KycTierDefinition {
  tierKey: string;
  routeSlug: string;
  tierLabel: string;
  tierOrdinal: number;
  processingTime: string | null;
  isAutoGranted: boolean;
  submissionBehavior: KycSubmissionBehavior;
  requiredTextFields: KycTextFieldDefinition[];
  requiredDocuments: KycDocumentDefinition[];
  detailTitle: string;
  detailSubtitle: string;
  badgeLabel: string | null;
  /** Must be approved before this tier accepts a submission. */
  prerequisiteTierKey: string | null;
}

export type KycSubmissionStatus =
  | "draft_submission"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected";

/** Statuses that block a second submission for the same tier. */
export const ACTIVE_KYC_SUBMISSION_STATUSES: KycSubmissionStatus[] = [
  "draft_submission",
  "submitted",
  "under_review",
  "approved",
];

export interface KycSubmissionDocument {
  fieldName: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  cloudinaryId: string;
  uploadedAt: string;
}

export type KycSubmitterRole =
  | UserRole.BUYER
  | UserRole.DISTRIBUTOR
  | UserRole.OEM
  | UserRole.ENGINEER;

export interface KycSubmission {
  _id: string;
  userId: string;
  userRole: KycSubmitterRole;
  tierKey: string;
  tierLabel: string;
  routeSlug?: string;
  status: KycSubmissionStatus;
  textFields: Record<string, string>;
  documents: KycSubmissionDocument[];
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  submittedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface KycApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface KycPaginatedEnvelope<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: number | null;
  previousPage: number | null;
}

/** Human-readable status from `formatStatusLabel` on the server. */
export type KycStatusLabel =
  | "Draft"
  | "Pending"
  | "Under review"
  | "Approved"
  | "Rejected";

export interface AdminKycListRow {
  _id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  kycLevel: string;
  /** `"<uploaded>/<required>"`, e.g. `"2/3"`. */
  documentSubmitted: string;
  role: string;
  status: KycStatusLabel | string;
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
  requestStatusLabel: KycStatusLabel | string;
}

/** Admin tier catalogue rows — same shape as the submitter tier definition. */
export type AdminKycTierDefinition = KycTierDefinition & {
  role?: KycSubmitterRole;
};

/* ------------------------------------------------------------------ */
/* Upload constraints (mirror server `config.ts`)                      */
/* ------------------------------------------------------------------ */

export const KYC_ALLOWED_UPLOAD_EXTENSIONS = [
  ".doc",
  ".docx",
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
] as const;

export const KYC_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const KYC_UPLOAD_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/** Multer `files` limit on `POST /kyc/submissions`. */
export const KYC_UPLOAD_MAX_FILES = 10;

/** `accept` attribute for KYC file inputs. */
export const KYC_UPLOAD_ACCEPT = KYC_ALLOWED_UPLOAD_EXTENSIONS.join(",");
