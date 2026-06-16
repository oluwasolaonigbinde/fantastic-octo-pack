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

export const canEditProduct = (status: ProductStatus): boolean => status === "draft";
export const hasOemBadge = (status: OemApprovalStatus): boolean => status === "approved";
