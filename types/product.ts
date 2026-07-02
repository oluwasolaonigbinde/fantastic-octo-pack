import { UserData } from "./user";

export interface ProductImage {
  url: string;
  cloudinary_id: string;
  isDefault: boolean;
  originalName?: string;
}

export type ProductStatus = "draft" | "pending" | "approved" | "rejected";
export type OemApprovalStatus =
  | "not_requested"
  | "pending"
  | "approved"
  | "rejected";

export interface KeyAttributeItem {
  spec?: string;
  detail?: string;
  label?: string;
  value?: string;
}

export interface KeyAttributes {
  industry_specific?: KeyAttributeItem[];
  other?: KeyAttributeItem[];
}

export interface CertificationRef {
  name?: string;
  url: string;
  cloudinary_id?: string;
  originalName?: string;
}

/**
 * Value supplied for one of the category's admin-defined base specifications.
 * Required base specs must be supplied when listing a product in that category.
 */
export interface CategorySpecification {
  key: string;
  value: string;
}

/** Distributor-defined free-form specification (key/value pair). */
export interface CustomSpecification {
  key: string;
  value: string;
}

export interface Product {
  _id: string;
  name: string;
  category: string;
  /** Subcategory names (each is one of the category's subcategories). */
  sub_category?: string[];
  brand_oem?: string;
  manufacturing_country?: string;
  condition?: "new" | "used" | "refurbished";
  pricePerUnit: number;
  pricing_type?: "fixed" | "negotiable" | "rfq";
  unit_of_measure?: string;
  /** Values for the category's admin-defined base specifications. */
  categorySpecifications?: CategorySpecification[];
  /** Distributor-defined free-form specifications. */
  customSpecifications?: CustomSpecification[];
  requiresInstallation?: boolean;
  images: ProductImage[];
  description?: string;
  availability_status?: "in_stock" | "out_of_stock" | "on_order";
  installation_time?: string;
  delivery_time?: string;
  return_policy?: string;
  sku?: string;
  video_link?: string;
  certifications?: CertificationRef[];
  brochure?: CertificationRef;
  featured?: boolean;
  oemApprovalStatus: OemApprovalStatus;
  hasOemBadge?: boolean;
  visibilityRejectionReason?: string;
  oemRejectionReason?: string;
  createdBy: string | UserData;
  assignedOem?: string | UserData;
  status: ProductStatus;
  submittedAt?: string | null;
  createdAt: string;
  updatedAt: string;

  // --- Legacy compatibility (read-only; no longer sent on create/update) ---
  /** @deprecated Legacy field. Prefer pricing_type. */
  quantityAvailable?: number;
  /** @deprecated Legacy field. Prefer pricing_type. */
  priceMode?: "fixed" | "negotiable";
  /** @deprecated Legacy field. */
  countries?: string[];
  /** @deprecated Legacy field. */
  isRfqAvailable?: boolean;
  /** @deprecated Legacy field; replaced by categorySpecifications/customSpecifications. */
  keySpecifications?: string;
  /** @deprecated Legacy field; replaced by categorySpecifications/customSpecifications. */
  key_attributes?: KeyAttributes;
}

export interface ProductStatusCounts {
  draft: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface ProductListSummary {
  statusCounts: ProductStatusCounts;
}

export interface UpdateProduct {
  name?: string;
  category?: string;
  /** Subcategory names (each must be one of the category's subcategories). */
  sub_category?: string[];
  brand_oem?: string;
  assignedOem?: string | null;
  manufacturing_country?: string;
  condition?: "new" | "used" | "refurbished";
  pricePerUnit?: number;
  pricing_type?: "fixed" | "negotiable" | "rfq";
  unit_of_measure?: string;
  categorySpecifications?: CategorySpecification[];
  customSpecifications?: CustomSpecification[];
  requiresInstallation?: boolean;
  images?: ProductImage[];
  description?: string;
  availability_status?: "in_stock" | "out_of_stock" | "on_order";
  installation_time?: string;
  delivery_time?: string;
  return_policy?: string;
  sku?: string;
  video_link?: string;
  certifications?: CertificationRef[];
  brochure?: CertificationRef;
}

export interface ProductListResponse {
  success: boolean;
  message: string;
  data: {
    docs: Product[];
    page: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage: boolean | null;
    previousPage: boolean | null;
    totalDocs: number;
    totalPages: number;
    summary?: ProductListSummary;
  };
}

export interface ProductResponse {
  success: boolean;
  message: string;
  data: Product;
}

export type CreateProductDto = {
  name: string;
  category: string;
  /** Subcategory names (each must be one of the category's subcategories). */
  sub_category?: string[];
  brand_oem?: string;
  assignedOem?: string | null;
  manufacturing_country: string;
  condition: "new" | "used" | "refurbished";
  pricePerUnit: number;
  pricing_type: "fixed" | "negotiable" | "rfq";
  unit_of_measure: string;
  categorySpecifications?: CategorySpecification[];
  customSpecifications?: CustomSpecification[];
  requiresInstallation?: boolean;
  description: string;
  availability_status: "in_stock" | "out_of_stock" | "on_order";
  installation_time: string;
  delivery_time: string;
  images: ProductImage[];
  return_policy?: string;
  sku?: string;
  video_link?: string;
  certifications?: CertificationRef[];
};

export type ReviewProductDto = {
  action: "approve" | "reject";
  rejectionReason?: string;
};

export type ReviewProductVisibilityDto = {
  action: "approve" | "reject";
  rejectionReason?: string;
};
