import type { OemApprovalStatus, ProductStatus } from "@/types/product";

export const getListingStatusMeta = (
  status: ProductStatus
): { label: string; className: string } => {
  switch (status) {
    case "draft":
      return { label: "Draft", className: "bg-gray5 text-gray3" };
    case "pending":
      return { label: "Pending", className: "bg-yellow-100 text-yellow-700" };
    case "approved":
      return { label: "Approved", className: "bg-green-100 text-green-700" };
    case "rejected":
      return { label: "Rejected", className: "bg-red-100 text-red-700" };
    default:
      return { label: status, className: "bg-gray5 text-gray3" };
  }
};

export const getOemReviewStatusMeta = (
  status: OemApprovalStatus
): { label: string; className: string } => {
  switch (status) {
    case "pending":
      return { label: "Pending Review", className: "bg-yellow-100 text-yellow-700" };
    case "approved":
      return { label: "OEM Approved", className: "bg-green-100 text-green-700" };
    case "rejected":
      return { label: "Badge Rejected", className: "bg-red-100 text-red-700" };
    case "not_requested":
      return { label: "Not Requested", className: "bg-gray5 text-gray3" };
    default:
      return { label: status, className: "bg-gray5 text-gray3" };
  }
};

/**
 * A distributor may edit a product while it is a `draft` (direct edit) or once
 * it is `approved`/live (the edit is held as a pending revision until an admin
 * approves it). Products actively `pending` first review, or `rejected`, stay
 * locked in this slice.
 */
export const canEditProduct = (status: ProductStatus): boolean =>
  status === "draft" || status === "approved";

/**
 * Editing an approved product does not change the live listing — it produces a
 * pending revision awaiting admin approval. Draft edits save directly.
 */
export const editCreatesRevision = (status: ProductStatus): boolean =>
  status === "approved";

export const hasOemBadge = (status: OemApprovalStatus): boolean => status === "approved";
